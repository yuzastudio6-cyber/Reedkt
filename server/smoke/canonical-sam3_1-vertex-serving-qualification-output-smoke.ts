import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingQualificationResult,
} from '../services/canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  createCanonicalSam31VertexServingQualificationPreparationRef,
} from '../services/canonical-sam3_1-vertex-serving-qualification-preparation-service'
import {
  assertCanonicalSam31VertexServingQualificationOutput,
  createCanonicalSam31VertexServingQualificationOutputRepository,
  createCanonicalSam31VertexServingQualificationOutputService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-output-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  preparation,
  task,
  taskStore,
} from './canonical-sam3_1-vertex-serving-qualification-preparation-smoke'

const NOW = '2026-08-11T12:04:00.000Z'
const manifestHash = sha256AuthorityValue('serving-output-smoke-manifest')
const source = task.runtimeRequest.sourceMedia
export const response = buildCanonicalSam31GpuRuntimeResponse({
  schemaVersion: 'canonical-sam3_1-gpu-runtime-response-v1',
  operationId: task.runtimeRequest.operationId,
  requestBindingSha256: task.runtimeRequest.requestBindingSha256,
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
  status: 'completed',
  terminalStage: 'completed',
  gpuEvidence: {
    requestedAccelerator: 'nvidia_a100_80gb',
    observedDeviceNameDigestSha256: sha256AuthorityValue('A100 80GB'),
    observedNvidiaDriverVersion: '570.211.01',
    observedCudaRuntimeVersion: '12.8',
    observedTorchVersion: '2.10.0+cu128',
    observedTorchcodecVersion: '0.10.0',
    observedComputeCapabilityMajor: 8,
    observedComputeCapabilityMinor: 0,
    observedTotalDeviceMemoryBytes: 85_899_345_920,
    maximumObservedNvdecUtilizationPercent: 20,
    maximumObservedGpuUtilizationPercent: 95,
    cudaAvailable: true,
    bfloat16AutocastUsed: true,
    nvdecHardwareDecodeMeasured: true,
    decodedFramesResidentOnCuda: true,
    boundedCpuOutputSerializationUsed: true,
    cudaKernelExecutionMeasured: true,
    cpuOnlyInferenceUsed: false,
    gpuMemoryProfileId: 'a100_full_gpu_state_v1',
    pastNonConditioningMemoryTrimmedOnGpu: false,
    cudaDriverLibraryMode: 'host_driver',
    observedCudaDriverLibraryPathDigestSha256:
      sha256AuthorityValue('libcuda.so'),
    cudaForwardCompatibilityPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    cudaForwardCompatibilityLibraryLoaded: false,
    hostCudaDriverLibraryLoaded: true,
  },
  runtimeMeasurement: {
    wallTimeMilliseconds: 73_000,
    modelLoadMilliseconds: 20_000,
    promptMilliseconds: 2_000,
    propagationMilliseconds: 26_000,
    outputPersistenceMilliseconds: 1_000,
    cudaEventInferenceMilliseconds: 29_000,
    peakCudaAllocatedBytes: 25_000_000_000,
    peakCudaReservedBytes: 28_000_000_000,
    outputFileCount: source.decodedFrameCount + 1,
    outputByteLength: 900_000,
  },
  outputSummary: {
    manifestRef: ref('sam31-serving-output-smoke-manifest', manifestHash),
    manifestSha256: manifestHash,
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
const outputTaskStore = {
  ...taskStore,
  async rereadRuntimeResponse(invocationId: string) {
    return invocationId === task.invocationId
      ? structuredClone(response) : null
  },
}
const responseBytes = Buffer.from(canonicalSam31GpuWireStringify(response),
  'utf8')
const responseHash = rawSha256(responseBytes)
const servingResult = buildServingResult()
const outputEvidence = buildOutputEvidence()
const records = new Map<string, Buffer>()
const objectPort = memoryObjectPort(records)
const runtimeResultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort,
  prefix: 'private/smoke/sam31-serving-output-runtime',
})
const repository =
  createCanonicalSam31VertexServingQualificationOutputRepository({
    objectPort,
    prefix: 'private/smoke/sam31-serving-output-receipts',
  })
let outputRereads = 0
const service = createCanonicalSam31VertexServingQualificationOutputService({
  preparationRepository: {
    async reread() { return structuredClone(preparation) },
  },
  invocationRepository: {
    async rereadTerminal() { return structuredClone(servingResult) },
  },
  taskStore: outputTaskStore,
  outputRereadPort: {
    async rereadExactServingPrivateOutput() {
      outputRereads += 1
      return structuredClone(outputEvidence)
    },
  },
  runtimeResultStore,
  repository,
  now: () => NOW,
})

const output = await service.verifyOne({ invocationId: task.invocationId })
assert.deepEqual(assertCanonicalSam31VertexServingQualificationOutput(output),
  output)
assert.equal(output.propagatedFrameCount, source.decodedFrameCount)
assert.equal(output.maskFileCount, source.decodedFrameCount)
assert.equal(output.exactManifestAndEveryLosslessMaskReread, true)
assert.equal(output.everyMaskPngDecodedAndDimensionsVerified, true)
assert.equal(output.customerCreditsMutated, false)
assert.equal(output.qaApproved, false)
assert.equal(output.productionAuthorityGranted, false)
assert.equal(outputRereads, 1)

const replay = await service.verifyOne({ invocationId: task.invocationId })
assert.equal(replay.outputHash, output.outputHash)
assert.equal(outputRereads, 1)

await assert.rejects(() => createCanonicalSam31VertexServingQualificationOutputService({
  preparationRepository: {
    async reread() { return structuredClone(preparation) },
  },
  invocationRepository: {
    async rereadTerminal() {
      return { ...servingResult, disposition: 'failed' }
    },
  },
  taskStore: outputTaskStore,
  outputRereadPort: {
    async rereadExactServingPrivateOutput() { return outputEvidence },
  },
  runtimeResultStore:
    createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/smoke/sam31-serving-output-rejected-runtime',
    }),
  repository: createCanonicalSam31VertexServingQualificationOutputRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/sam31-serving-output-rejected',
  }),
}).verifyOne({ invocationId: task.invocationId }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-qualification-output',
  status: 'passed',
  checks: 14,
  exactServingTaskResponseAndOutputReread: true,
  everyLosslessMaskHashAndDecodeRequired: true,
  replayUsesDurableReceiptWithoutSecondOutputRead: true,
  customerCreditsMutated: false,
  qaApproved: false,
  productionAuthorityGranted: false,
}, null, 2))

function buildServingResult() {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-qualification-result-v1' as const,
    source: (
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner'
    ) as const,
    invocationPurpose: 'private_pre_release_qualification' as const,
    qualificationId: preparation.qualificationId,
    runOrdinal: preparation.runOrdinal,
    invocationId: task.invocationId,
    qualificationPreparationRef:
      createCanonicalSam31VertexServingQualificationPreparationRef(preparation),
    qualificationCandidateRef: task.runtimeReleaseRef,
    attemptRef: ref('sam31-serving-output-smoke-attempt', '2'.repeat(64)),
    callStartRef: ref('sam31-serving-output-smoke-call-start', '3'.repeat(64)),
    disposition: 'completed' as const,
    runtimeStatus: 'completed' as const,
    runtimeResponseRef: ref(
      `sam31-gpu-response:${task.invocationId}`,
      responseHash,
    ),
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'private_response_reconciliation' as const,
    providerCallStarted: true as const,
    providerOutcome: 'executed' as const,
    providerRoundTripDurationMilliseconds: null,
    exactPrivateRuntimeResponseReread: true,
    exactVertexPredictionWrapperReread: false,
    automaticRetryAllowed: false as const,
    unresolvedOutcomeBlocksRetry: false,
    customerInvocationAuthorized: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    runtimeReleaseGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: NOW,
  }
  return assertCanonicalSam31VertexServingQualificationResult({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function buildOutputEvidence() {
  const payload = {
    schemaVersion: (
      'canonical-sam3_1-private-output-reread-evidence-v1'
    ) as const,
    source: 'canonical_server_sam3_1_private_output_reader' as const,
    evidenceClass: 'canonical_private_reread' as const,
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeResponseObjectRef: ref(
      `sam31-runtime-response:${task.invocationId}`,
      responseHash,
    ),
    runtimeResponseBindingSha256: response.responseBindingSha256,
    manifestRef: response.outputSummary!.manifestRef,
    manifestSha256: manifestHash,
    manifestByteLength: 4_096,
    maskSequenceArtifactRef: ref('sam31-serving-output-smoke-masks',
      manifestHash),
    maskFileCount: source.decodedFrameCount,
    combinedMaskByteLength: 10_000,
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
    rereadAt: NOW,
  }
  return assertCanonicalSam31PrivateOutputRereadEvidence({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function memoryObjectPort(records: Map<string, Buffer>):
CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body, contentSha256 }) {
      assert.equal(rawSha256(body), contentSha256)
      const existing = records.get(objectPath)
      if (existing) {
        assert.equal(stableAuthorityStringify(JSON.parse(
          existing.toString('utf8'),
        )), stableAuthorityStringify(JSON.parse(body.toString('utf8'))))
        return 'already_exists'
      }
      records.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = records.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
