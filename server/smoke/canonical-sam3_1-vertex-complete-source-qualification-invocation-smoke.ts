import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { GoogleAuth } from 'google-auth-library'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexCompleteSourceQualificationAttempt,
  assertCanonicalSam31VertexCompleteSourceQualificationResult,
  createCanonicalSam31VertexCompleteSourceQualificationInvocationRepository,
  createCanonicalSam31VertexCompleteSourceQualificationInvocationService,
  type CanonicalSam31VertexCompleteSourceQualificationInvocationRepository,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-invocation-service'
import {
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  preparation,
  preparationRepository,
  task,
  taskStore,
} from
  './canonical-sam3_1-vertex-complete-source-qualification-preparation-smoke'

const NOW = '2026-08-13T16:13:00.000Z'
const runtime = runtimeResponse()
const runtimeBytes = Buffer.from(canonicalSam31GpuWireStringify(runtime),
  'utf8')
const runtimeHash = createHash('sha256').update(runtimeBytes).digest('hex')
const wrapper = {
  deployedModelId: '3101000016' as const,
  model:
    'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const,
  modelDisplayName: 'WeEditPro SAM 3.1 A100 scale-zero v1' as const,
  modelVersionId: '7' as const,
  predictions: [{
    schemaVersion: 'canonical-sam3_1-vertex-prediction-result-v1' as const,
    invocationId: task.invocationId,
    runtimeStatus: runtime.status,
    responseRef: {
      id: `sam31-gpu-response:${task.invocationId}`,
      version: 1,
      contentHash: `sha256:${runtimeHash}`,
    },
    uploadedObjectCount: runtime.runtimeMeasurement!.outputFileCount + 2,
    uploadedByteLength:
      runtime.runtimeMeasurement!.outputByteLength + runtimeBytes.byteLength,
    exactPrivateCreateOnlyPersistence: true as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    productionAuthorityGranted: false as const,
  }],
}
const request = {
  invocationId: task.invocationId,
  qualificationPreparationRef:
    createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
      preparation,
    ),
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
}

let checks = 0
const successRepository = repository()
let providerCalls = 0
const success = await service({
  repository: successRepository,
  runtimeResponse: runtime,
  request: async (providerRequest) => {
    providerCalls += 1
    assert.equal(providerRequest.retry, false)
    assert.equal(providerRequest.maxRedirects, 0)
    assert.deepEqual(providerRequest.data, {
      instances: [{
        invocationId: task.invocationId,
        dispatchAdmissionDigestSha256:
          task.runtimeRequest.dispatchAdmissionDigestSha256,
      }],
      parameters: {
        schemaVersion: 'canonical-sam3_1-vertex-prediction-request-v1',
        byteFree: true,
      },
    })
    return { data: wrapper }
  },
}).invokeOne(request)
assert.equal(success.disposition, 'completed')
assert.equal(success.invocationPurpose,
  'private_complete_source_pre_release_qualification')
assert.equal(success.chunkOrdinal, 1)
assert.equal(success.canonicalStartFrameInclusive, 0)
assert.equal(success.canonicalEndFrameInclusive, 239)
assert.equal(success.terminalEvidenceMode,
  'provider_prediction_and_private_response')
assert.equal(success.providerRoundTripDurationMilliseconds, 250)
assert.equal(success.exactPrivateRuntimeResponseReread, true)
assert.equal(success.exactVertexPredictionWrapperReread, true)
assert.equal(success.customerInvocationAuthorized, false)
assert.equal(success.customerCreditsMutated, false)
assert.equal(success.runtimeReleaseGranted, false)
assert.equal(success.productionAuthorityGranted, false)
assert.equal(providerCalls, 1)
checks += 16

const replay = await service({
  repository: successRepository,
  runtimeResponse: runtime,
  now: '2026-08-13T16:14:00.000Z',
  request: async () => {
    throw new Error('Terminal replay may not call Vertex.')
  },
}).invokeOne(request)
assert.equal(replay.resultHash, success.resultHash)
assert.equal(providerCalls, 1)
checks += 2

const reconcileRepository = repository()
const reconciled = await service({
  repository: reconcileRepository,
  runtimeResponse: runtime,
  request: async () => { throw new Error('simulated timeout') },
}).invokeOne(request)
assert.equal(reconciled.disposition, 'completed')
assert.equal(reconciled.terminalEvidenceMode,
  'private_response_reconciliation')
assert.equal(reconciled.exactVertexPredictionWrapperReread, false)
assert.equal(reconciled.providerRoundTripDurationMilliseconds, null)
checks += 4

const coldRepository = repository()
let coldCalls = 0
const cold = await service({
  repository: coldRepository,
  runtimeResponse: null,
  request: async () => {
    coldCalls += 1
    throw {
      response: {
        status: 429,
        data:
          'Model is not yet ready for inference. Please wait while model completes scale-up from zero, then try your request again.',
      },
    }
  },
}).invokeOne(request)
assert.equal(cold.disposition, 'not_executed_scale_from_zero_trigger')
assert.equal(cold.providerOutcome, 'not_executed')
assert.equal(cold.automaticRetryAllowed, false)
assert.equal(cold.unresolvedOutcomeBlocksRetry, false)
assert.equal(cold.runtimeResponseRef, null)
const coldReplay = await service({
  repository: coldRepository,
  runtimeResponse: null,
  request: async () => { coldCalls += 1; return { data: wrapper } },
}).invokeOne(request)
assert.equal(coldReplay.resultHash, cold.resultHash)
assert.equal(coldCalls, 1)
checks += 7

const unknownRepository = repository()
let unknownCalls = 0
const unknown = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => {
    unknownCalls += 1
    throw new Error('simulated unknown outcome')
  },
}).invokeOne(request)
assert.equal(unknown.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.unresolvedOutcomeBlocksRetry, true)
assert.equal(unknown.automaticRetryAllowed, false)
const unknownReplay = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => { unknownCalls += 1; return { data: wrapper } },
}).invokeOne(request)
assert.equal(unknownReplay.resultHash, unknown.resultHash)
assert.equal(unknownCalls, 1)
checks += 6

const attempt =
  assertCanonicalSam31VertexCompleteSourceQualificationAttempt(
    await successRepository.rereadAttempt({
      invocationId: task.invocationId,
    }),
  )
assert.equal(attempt.chunkOrdinal, 1)
assert.deepEqual(attempt.preparedChunkArtifactRef,
  preparation.preparedChunkArtifactRef)
assert.deepEqual(attempt.parentQualificationAdmissionRef,
  preparation.parentQualificationAdmissionRef)
assert.throws(() =>
  assertCanonicalSam31VertexCompleteSourceQualificationAttempt({
    ...attempt,
    customerInvocationAuthorized: true,
  }))
assert.throws(() =>
  assertCanonicalSam31VertexCompleteSourceQualificationResult({
    ...unknown,
    automaticRetryAllowed: true,
  }))
await assert.rejects(service({
  repository: repository(),
  runtimeResponse: null,
  request: async () => { throw new Error('invalid request called Vertex') },
}).invokeOne({
  ...request,
  dispatchAdmissionDigestSha256: '0'.repeat(64),
}))
checks += 6

assert.equal(checks, 41)
console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-complete-source-qualification-invocation',
  checks,
  exactChunkLineagePreserved: true,
  providerCallSingleUse: true,
  unknownOutcomeBlocksRetry: true,
  scaleFromZeroTriggerClassifiedNotExecuted: true,
  automaticRetryAllowed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}))

function service(input: {
  repository:
    CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
  runtimeResponse: unknown
  request: (request: Record<string, unknown>) => Promise<unknown>
  now?: string
}) {
  let clock = 1_000
  return createCanonicalSam31VertexCompleteSourceQualificationInvocationService({
    preparationRepository,
    taskStore: {
      ...taskStore,
      async rereadRuntimeResponse(invocationId) {
        return invocationId === task.invocationId
          ? structuredClone(input.runtimeResponse) : null
      },
    },
    repository: input.repository,
    auth: {
      async request(providerRequest: Record<string, unknown>) {
        if (providerRequest.method === 'GET') return { data: {
          name:
            'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
          displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
          dedicatedEndpointEnabled: true,
          dedicatedEndpointDns:
            'weeditpro-sam31-a100-scale-zero-v1.us-central1-390722338345.prediction.vertexai.goog',
          deployedModels: [{
            id: '3101000016',
            model:
              'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@7',
          }],
          trafficSplit: { '3101000016': 100 },
        } }
        return input.request(providerRequest)
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
    now: () => input.now ?? NOW,
    clockMilliseconds: () => { const value = clock; clock += 250; return value },
  })
}

function repository() {
  return createCanonicalSam31VertexCompleteSourceQualificationInvocationRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/sam31-complete-source-invocations',
  })
}

function runtimeResponse() {
  const manifestSha256 = sha256AuthorityValue('complete-source-mask-manifest')
  return buildCanonicalSam31GpuRuntimeResponse({
    schemaVersion: 'canonical-sam3_1-gpu-runtime-response-v1',
    operationId: task.runtimeRequest.operationId,
    requestBindingSha256: task.runtimeRequest.requestBindingSha256,
    dispatchAdmissionDigestSha256:
      task.runtimeRequest.dispatchAdmissionDigestSha256,
    status: 'completed',
    terminalStage: 'completed',
    gpuEvidence: {
      requestedAccelerator: 'nvidia_a100_80gb',
      observedDeviceNameDigestSha256: sha256AuthorityValue(
        'NVIDIA A100-SXM4-80GB',
      ),
      observedNvidiaDriverVersion: '570.211.01',
      observedCudaRuntimeVersion: '12.8',
      observedTorchVersion: '2.10.0+cu128',
      observedTorchcodecVersion: '0.10.0',
      observedComputeCapabilityMajor: 8,
      observedComputeCapabilityMinor: 0,
      observedTotalDeviceMemoryBytes: 85_899_345_920,
      maximumObservedNvdecUtilizationPercent: 82,
      maximumObservedGpuUtilizationPercent: 96,
      cudaAvailable: true,
      bfloat16AutocastUsed: true,
      nvdecHardwareDecodeMeasured: true,
      decodedFramesResidentOnCuda: true,
      boundedCpuOutputSerializationUsed: true,
      cudaKernelExecutionMeasured: true,
      cpuOnlyInferenceUsed: false,
      gpuMemoryProfileId:
        'a100_gpu_only_full_semantic_streamed_grounding_postprocess_trimmed_memory_v3',
      pastNonConditioningMemoryTrimmedOnGpu: true,
      cudaDriverLibraryMode: 'host_driver',
      observedCudaDriverLibraryPathDigestSha256: sha256AuthorityValue(
        '/usr/lib/x86_64-linux-gnu/libcuda.so.570.211.01',
      ),
      cudaForwardCompatibilityPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      cudaForwardCompatibilityLibraryLoaded: false,
      hostCudaDriverLibraryLoaded: true,
    },
    runtimeMeasurement: {
      wallTimeMilliseconds: 95_000,
      modelLoadMilliseconds: 15_000,
      promptMilliseconds: 1_000,
      propagationMilliseconds: 70_000,
      outputPersistenceMilliseconds: 9_000,
      cudaEventInferenceMilliseconds: 69_000,
      peakCudaAllocatedBytes: 42_000_000_000,
      peakCudaReservedBytes: 50_000_000_000,
      outputFileCount: 241,
      outputByteLength: 1_900_000_000,
    },
    outputSummary: {
      manifestRef: {
        id: 'complete-source-mask-manifest',
        version: 1,
        contentHash: `sha256:${manifestSha256}`,
      },
      manifestSha256,
      firstFrameIndex: 0,
      lastFrameIndex: 239,
      propagatedFrameCount: 240,
      distinctObjectIds: [0],
      losslessMaskPngCount: 240,
      normalizedBoxRecordCount: 240,
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
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const prior = values.get(input.objectPath)
      if (prior) return 'already_exists'
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
