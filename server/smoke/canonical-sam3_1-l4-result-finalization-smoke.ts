import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import {
  CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
  canonicalProfessionalGpuJobLaunchSchema,
  canonicalProfessionalGpuTerminalObservationSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31L4ResultFinalizationRuntime,
} from '../services/canonical-sam3_1-l4-result-finalization-service'
import {
  createCanonicalSam31PrivateCompleteSourceChunkResultReadPort,
  createCanonicalSam31PrivateCompleteSourceResultFinalizationPort,
} from '../services/canonical-sam3_1-private-complete-source-result-finalization-adapter'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  canonicalSam31PrivateOutputRereadEvidenceSchema,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import type {
  CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  canonicalSam31A100LaunchFixture,
  canonicalSam31A100ResultAdmissionFixture,
  canonicalSam31L4TargetFixture,
  canonicalSam31L4TaskFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const task = canonicalSam31L4TaskFixture
const source = task.runtimeRequest.sourceMedia
const manifestSha256 = sha256AuthorityValue('sam31-l4-mask-manifest')
const response = buildCanonicalSam31GpuRuntimeResponse({
  schemaVersion: 'canonical-sam3_1-gpu-runtime-response-v1',
  operationId: task.runtimeRequest.operationId,
  requestBindingSha256: task.runtimeRequest.requestBindingSha256,
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
  status: 'completed',
  terminalStage: 'completed',
  gpuEvidence: {
    requestedAccelerator: 'nvidia_l4',
    observedDeviceNameDigestSha256: sha256AuthorityValue('NVIDIA L4'),
    observedNvidiaDriverVersion: '570.211.01',
    observedCudaRuntimeVersion: '12.8',
    observedTorchVersion: '2.10.0+cu128',
    observedTorchcodecVersion: '0.10.0',
    observedComputeCapabilityMajor: 8,
    observedComputeCapabilityMinor: 9,
    observedTotalDeviceMemoryBytes: 24_940_576_768,
    maximumObservedNvdecUtilizationPercent: 76,
    maximumObservedGpuUtilizationPercent: 97,
    cudaAvailable: true,
    bfloat16AutocastUsed: true,
    nvdecHardwareDecodeMeasured: true,
    decodedFramesResidentOnCuda: true,
    boundedCpuOutputSerializationUsed: true,
    cudaKernelExecutionMeasured: true,
    cpuOnlyInferenceUsed: false,
    gpuMemoryProfileId:
      'l4_gpu_only_full_semantic_streamed_grounding_postprocess_trimmed_memory_v6',
    pastNonConditioningMemoryTrimmedOnGpu: true,
    cudaDriverLibraryMode: 'host_driver',
    observedCudaDriverLibraryPathDigestSha256: sha256AuthorityValue(
      '/usr/local/nvidia/lib64/libcuda.so.570.211.01',
    ),
    cudaForwardCompatibilityPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    cudaForwardCompatibilityLibraryLoaded: false,
    hostCudaDriverLibraryLoaded: true,
  },
  runtimeMeasurement: {
    wallTimeMilliseconds: 160_000,
    modelLoadMilliseconds: 30_000,
    promptMilliseconds: 2_000,
    propagationMilliseconds: 108_000,
    outputPersistenceMilliseconds: 10_000,
    cudaEventInferenceMilliseconds: 106_000,
    peakCudaAllocatedBytes: 18_000_000_000,
    peakCudaReservedBytes: 22_000_000_000,
    outputFileCount: source.decodedFrameCount + 1,
    outputByteLength: 1_800_000_000,
  },
  outputSummary: {
    manifestRef: ref('sam31-l4-mask-manifest', manifestSha256),
    manifestSha256,
    firstFrameIndex: source.selectedStartFrameInclusive,
    lastFrameIndex: source.selectedEndFrameInclusive,
    propagatedFrameCount: source.decodedFrameCount,
    distinctObjectIds: [0],
    losslessMaskPngCount: source.decodedFrameCount,
    normalizedBoxRecordCount: source.decodedFrameCount,
    allMasksMatchSourceDimensions: true,
    allFramesWithinApprovedInterval: true,
    createOnlyPrivatePersistence: true,
    exactPrivateRereadPending: true,
  },
  failureCode: 'none',
  modelSourceAndCheckpointHashesVerifiedBeforeAndAfter: true,
  sourceCheckpointCompatibilityQualificationReread: true,
  serverCostReceiptIncluded: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
const responseBytes = Buffer.from(
  canonicalSam31GpuWireStringify(response),
  'utf8',
)
const responseBytesHash = hash(responseBytes)
const outputPayload = {
  schemaVersion: 'canonical-sam3_1-private-output-reread-evidence-v1' as const,
  source: 'canonical_server_sam3_1_private_output_reader' as const,
  evidenceClass: 'canonical_private_reread' as const,
  taskRef: ref(task.taskId, task.taskRecordHash),
  runtimeResponseObjectRef: ref(
    'sam31-l4-runtime-response',
    responseBytesHash,
  ),
  runtimeResponseBindingSha256: response.responseBindingSha256,
  manifestRef: response.outputSummary!.manifestRef,
  manifestSha256,
  manifestByteLength: 720_000,
  maskSequenceArtifactRef: ref('sam31-l4-private-mask-sequence'),
  maskFileCount: source.decodedFrameCount,
  combinedMaskByteLength: 1_799_280_000,
  width: source.width,
  height: source.height,
  firstFrameIndex: source.selectedStartFrameInclusive,
  lastFrameIndex: source.selectedEndFrameInclusive,
  propagatedFrameCount: source.decodedFrameCount,
  distinctObjectIds: [0],
  responseCreateOnlyPersistenceVerified: true as const,
  exactResponseBytesReread: true as const,
  exactManifestBytesRereadAndParsed: true as const,
  everyMaskPngByteHashReread: true as const,
  everyMaskPngDecodedDimensionsMatchSource: true as const,
  completeApprovedFrameIntervalCoverageVerified: true as const,
  noUnexpectedFilesOrCrossInvocationArtifacts: true as const,
  sourceCheckpointOrTaskBytesMutated: false as const,
  pathsUrlsCredentialsOrMediaBytesIncluded: false as const,
  qaApproved: false as const,
  assetManifestMutated: false as const,
  customerCreditsMutated: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  rereadAt: '2026-08-02T18:06:00.000Z',
}
const outputEvidence = canonicalSam31PrivateOutputRereadEvidenceSchema.parse({
  ...outputPayload,
  evidenceHash: sha256AuthorityValue(outputPayload),
})

const launchPayload = {
  schemaVersion: 'canonical-professional-gpu-job-launch-v1' as const,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  launchRecordId: 'sam31-l4-launch',
  admissionRef: task.dispatchAdmissionRef,
  admissionConsumptionRef: task.admissionConsumptionRef,
  runtimeReleaseRef: task.runtimeReleaseRef,
  executionEnvelopeRef: task.executionEnvelopeRef,
  toolId: 'sam3_1',
  operationId: task.runtimeRequest.operationId,
  routeId: 'l4_heavy_fallback' as const,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_run_l4_job' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageDigest: canonicalSam31L4TargetFixture.immutableImageDigest,
  cloudJobCreateRequestRef: ref('sam31-l4-create-request'),
  cloudJobExecutionRef: ref('sam31-l4-cloud-execution'),
  launchDisposition: 'job_created' as const,
  providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed' as const,
  createOnlyAdmissionConsumedBeforeLaunch: true as const,
  duplicateLaunchAllowed: false as const,
  unknownOutcomeRetryAllowed: false as const,
  noApprovedAdmissionMeansZeroGpuJobs: true as const,
  minimumIdleInstances: 0 as const,
  prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  launchedAt: '2026-08-02T18:01:00.000Z',
}
const launch = canonicalProfessionalGpuJobLaunchSchema.parse({
  ...launchPayload,
  launchHash: sha256AuthorityValue(launchPayload),
})

const objects = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objects)
const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort,
})
await lifecycleStore.createLaunchRecordOnly({ record: launch })
const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort,
})
const taskStore: CanonicalSam31GpuTaskStore = {
  schemaVersion: 'canonical-sam3_1-gpu-task-store-v1',
  evidenceClass: 'gcs_generation_create_only_sam3_1_task_store',
  async persistTaskCreateOnly() { return 'already_exists' },
  async rereadTask(invocationId) {
    assert.equal(invocationId, task.invocationId)
    return structuredClone(task)
  },
  async rereadRuntimeResponse(invocationId) {
    assert.equal(invocationId, task.invocationId)
    return structuredClone(response)
  },
}
let terminalReads = 0
let outputReads = 0
const runtime = createCanonicalSam31L4ResultFinalizationRuntime({
  lifecycleStore,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      terminalReads += 1
      return buildObservation()
    },
  },
  taskStore,
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      outputReads += 1
      return structuredClone(outputEvidence)
    },
  },
  resultStore,
  now: () => '2026-08-02T18:07:00.000Z',
})

const first = await runtime.finalize({
  invocationId: task.invocationId,
  launchRecordId: launch.launchRecordId,
})
assert.equal(first.routeId, 'l4_heavy_fallback')
assert.equal(first.accelerator, 'nvidia_l4')
assert.equal(first.terminalWorkerStoppedAndScaleBackToZeroVerified, true)
assert.equal(first.accountEffectiveAttemptCostReceiptPersisted, true)
assert.equal(first.qaApproved, false)
assert.equal(terminalReads, 1)
assert.equal(outputReads, 1)

const replay = await runtime.finalize({
  invocationId: task.invocationId,
  launchRecordId: launch.launchRecordId,
})
assert.equal(replay.resultAdmissionHash, first.resultAdmissionHash)
assert.equal(terminalReads, 1)
assert.equal(outputReads, 1)

const a100Objects = new Map<string, Buffer>()
const a100LifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort: memoryObjectPort(a100Objects),
})
await a100LifecycleStore.createLaunchRecordOnly({
  record: canonicalSam31A100LaunchFixture,
})
const crossedRuntime = createCanonicalSam31L4ResultFinalizationRuntime({
  lifecycleStore: a100LifecycleStore,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      throw new Error('cross-route launch reached terminal observation')
    },
  },
  taskStore,
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      throw new Error('cross-route launch reached output reread')
    },
  },
  resultStore: createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: memoryObjectPort(new Map()),
  }),
})
await assert.rejects(() => crossedRuntime.finalize({
  invocationId: canonicalSam31A100LaunchFixture.executionEnvelopeRef.id,
  launchRecordId: canonicalSam31A100LaunchFixture.launchRecordId,
}), /L4 finalization launch scope differs/u)

let a100Dispatches = 0
let l4Dispatches = 0
const finalizationPort =
  createCanonicalSam31PrivateCompleteSourceResultFinalizationPort({
    a100: {
      schemaVersion: 'canonical-sam3_1-a100-result-finalization-v1',
      evidenceClass: 'canonical_terminal_private_output_and_result_reread',
      async finalize() {
        a100Dispatches += 1
        return structuredClone(canonicalSam31A100ResultAdmissionFixture)
      },
    },
    l4: {
      schemaVersion: 'canonical-sam3_1-l4-result-finalization-v1',
      evidenceClass: 'canonical_terminal_private_output_and_result_reread',
      async finalize() {
        l4Dispatches += 1
        return structuredClone(first)
      },
    },
  })
await finalizationPort.finalize({
  routeId: 'a100_80gb_heavy_primary',
  invocationId: canonicalSam31A100ResultAdmissionFixture.executionEnvelopeRef.id,
  launchRecordId: canonicalSam31A100ResultAdmissionFixture.launchRef.id,
  executionPlanRef: ref('complete-source-plan'),
  chunkOrdinal: 1,
})
await finalizationPort.finalize({
  routeId: 'l4_heavy_fallback',
  invocationId: first.executionEnvelopeRef.id,
  launchRecordId: first.launchRef.id,
  executionPlanRef: ref('complete-source-plan'),
  chunkOrdinal: 1,
})
assert.equal(a100Dispatches, 1)
assert.equal(l4Dispatches, 1)
await assert.rejects(() => finalizationPort.finalize({
  routeId: 'l4_standard_primary',
  invocationId: task.invocationId,
  launchRecordId: launch.launchRecordId,
  executionPlanRef: ref('complete-source-plan'),
  chunkOrdinal: 1,
} as never), /result route is unsupported/u)

const crossedFinalizationPort =
  createCanonicalSam31PrivateCompleteSourceResultFinalizationPort({
    a100: {
      schemaVersion: 'canonical-sam3_1-a100-result-finalization-v1',
      evidenceClass: 'canonical_terminal_private_output_and_result_reread',
      async finalize() {
        return structuredClone(canonicalSam31A100ResultAdmissionFixture)
      },
    },
    l4: {
      schemaVersion: 'canonical-sam3_1-l4-result-finalization-v1',
      evidenceClass: 'canonical_terminal_private_output_and_result_reread',
      async finalize() {
        return structuredClone(canonicalSam31A100ResultAdmissionFixture)
      },
    },
  })
await assert.rejects(() => crossedFinalizationPort.finalize({
  routeId: 'l4_heavy_fallback',
  invocationId: task.invocationId,
  launchRecordId: launch.launchRecordId,
  executionPlanRef: ref('complete-source-plan'),
  chunkOrdinal: 1,
}), /crossed accelerators/u)

const resultReadPort =
  createCanonicalSam31PrivateCompleteSourceChunkResultReadPort({
    lifecycleStore,
    resultStore,
  })
assert.equal(
  (await resultReadPort.rereadLaunch({ launchRef: first.launchRef }))
    .launchRecordId,
  launch.launchRecordId,
)
assert.equal(
  (await resultReadPort.rereadTerminal({ terminalRef: first.terminalRef }))
    .terminalRecordId,
  first.terminalRef.id,
)
assert.equal(
  (await resultReadPort.rereadResultAdmission({
    invocationId: task.invocationId,
    resultAdmissionRef: ref(first.resultAdmissionId, first.resultAdmissionHash),
  })).resultAdmissionHash,
  first.resultAdmissionHash,
)
assert.equal(
  (await resultReadPort.rereadPrivateOutputEvidence({
    invocationId: task.invocationId,
    privateOutputRereadEvidenceRef: first.privateOutputRereadEvidenceRef,
  })).evidenceHash,
  outputEvidence.evidenceHash,
)
await assert.rejects(() => resultReadPort.rereadLaunch({
  launchRef: {
    ...first.launchRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}), /canonical result reference changed/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-l4-result-finalization',
  checks: 25,
  l4GenericTerminalRecordedCreateOnly: true,
  exactL4TaskResponseAndPrivateOutputReread: true,
  accountEffectiveAttemptCostAndScaleZeroBound: true,
  replayStartsNoSecondTerminalOrOutputRead: true,
  a100LaunchRejectedByL4Finalizer: true,
  providerNeutralA100AndL4FinalizationAdapter: true,
  nonSamHeavyRouteRejectedBeforeFinalization: true,
  crossRouteResultRelabelRejected: true,
  exactLaunchTerminalResultAndOutputReadPort: true,
  tamperedCanonicalRefRejected: true,
  cpuSubstantiveExecutionUsed: false,
  qaAssetsCreditsRenderPublicProductionRemainClosed: true,
}, null, 2))

function buildObservation() {
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
    source: 'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    cloudJobExecutionRef: launch.cloudJobExecutionRef,
    cloudTerminalObservationRef: ref('l4-cloud-terminal'),
    cloudCapacityTeardownObservationRef: ref('l4-capacity-stop'),
    workerUsageEvidenceRef: ref('l4-worker-usage'),
    currentAccountPriceAuthorityRef: task.fallbackRateAuthorityRef,
    attemptCostReceiptRef: ref('l4-attempt-cost'),
    terminalOutcome: 'completed' as const,
    providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
    cloudJobTerminalStateReread: true,
    workerStoppedVerified: true,
    activeGpuInstancesAfterTerminalObservation: 0 as const,
    exactPlatformUsageAndAccountPriceReread: true as const,
    costReceiptPersistedBeforeSettlement: true as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    callerOrPlanTerminalClaimAccepted: false as const,
    observedAt: '2026-08-02T18:05:00.000Z',
  }
  return canonicalProfessionalGpuTerminalObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(hash(input.body), input.contentSha256)
      const existing = values.get(input.objectPath)
      if (existing) {
        assert.equal(existing.equals(input.body), true)
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function ref(id: string, rawHash = sha256AuthorityValue(id)) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${rawHash}` as const,
  }
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
