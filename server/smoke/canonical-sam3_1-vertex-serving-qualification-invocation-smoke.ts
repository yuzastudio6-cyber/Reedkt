import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { GoogleAuth } from 'google-auth-library'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingQualificationAttempt,
  assertCanonicalSam31VertexServingQualificationResult,
  createCanonicalSam31VertexServingQualificationInvocationRepository,
  createCanonicalSam31VertexServingQualificationInvocationService,
  type CanonicalSam31VertexServingQualificationInvocationRepository,
} from '../services/canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  createCanonicalSam31VertexServingQualificationPreparationRef,
} from '../services/canonical-sam3_1-vertex-serving-qualification-preparation-service'
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
} from './canonical-sam3_1-vertex-serving-qualification-preparation-smoke'

const NOW = '2026-08-11T12:02:00.000Z'
const response = runtimeResponse()
const responseBytes = Buffer.from(canonicalSam31GpuWireStringify(response),
  'utf8')
const responseHash = createHash('sha256').update(responseBytes).digest('hex')
const prediction = {
  schemaVersion: 'canonical-sam3_1-vertex-prediction-result-v1' as const,
  invocationId: task.invocationId,
  runtimeStatus: response.status,
  responseRef: {
    id: `sam31-gpu-response:${task.invocationId}`,
    version: 1,
    contentHash: `sha256:${responseHash}`,
  },
  uploadedObjectCount: response.runtimeMeasurement!.outputFileCount + 2,
  uploadedByteLength: response.runtimeMeasurement!.outputByteLength
    + responseBytes.byteLength,
  exactPrivateCreateOnlyPersistence: true as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  productionAuthorityGranted: false as const,
}
const wrapper = {
  deployedModelId: '3101000001' as const,
  model:
    'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const,
  modelDisplayName: 'WeEditPro SAM 3.1 A100 scale-zero v1' as const,
  modelVersionId: '1' as const,
  predictions: [prediction],
}
const request = {
  invocationId: task.invocationId,
  qualificationPreparationRef:
    createCanonicalSam31VertexServingQualificationPreparationRef(preparation),
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
}

let checks = 0
const successRepository = repository()
let successCalls = 0
const success = await service({
  repository: successRepository,
  runtimeResponse: response,
  request: async (providerRequest) => {
    successCalls += 1
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
assert.equal(success.invocationPurpose, 'private_pre_release_qualification')
assert.equal(success.terminalEvidenceMode,
  'provider_prediction_and_private_response')
assert.equal(success.providerRoundTripDurationMilliseconds, 250)
assert.equal(success.exactPrivateRuntimeResponseReread, true)
assert.equal(success.exactVertexPredictionWrapperReread, true)
assert.equal(success.customerInvocationAuthorized, false)
assert.equal(success.customerCreditsMutated, false)
assert.equal(success.runtimeReleaseGranted, false)
assert.equal(success.productionAuthorityGranted, false)
assert.equal(successCalls, 1)
checks += 11

const replay = await service({
  repository: successRepository,
  runtimeResponse: response,
  request: async () => {
    throw new Error('Terminal replay may not call Vertex.')
  },
}).invokeOne(request)
assert.equal(replay.resultHash, success.resultHash)
assert.equal(successCalls, 1)
checks += 2

const reconcileRepository = repository()
const reconciled = await service({
  repository: reconcileRepository,
  runtimeResponse: response,
  request: async () => { throw new Error('simulated timeout') },
}).invokeOne(request)
assert.equal(reconciled.disposition, 'completed')
assert.equal(reconciled.terminalEvidenceMode,
  'private_response_reconciliation')
assert.equal(reconciled.exactVertexPredictionWrapperReread, false)
assert.equal(reconciled.providerRoundTripDurationMilliseconds, null)
checks += 4

const unknownRepository = repository()
let unknownCalls = 0
const unknown = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => {
    unknownCalls += 1
    throw new Error('simulated unknown provider outcome')
  },
}).invokeOne(request)
assert.equal(unknown.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknown.unresolvedOutcomeBlocksRetry, true)
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(unknown.providerOutcome, 'unknown')
const unknownReplay = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => {
    unknownCalls += 1
    return { data: wrapper }
  },
}).invokeOne(request)
assert.equal(unknownReplay.resultHash, unknown.resultHash)
assert.equal(unknownCalls, 1)
checks += 6

const attempt = assertCanonicalSam31VertexServingQualificationAttempt(
  await successRepository.rereadAttempt({ invocationId: task.invocationId }),
)
assert.equal(attempt.invocationPurpose, 'private_pre_release_qualification')
assert.equal(attempt.currentA100ServingRateAuthorityRef.contentHash,
  preparation.currentA100ServingRateAuthorityRef.contentHash)
assert.equal(attempt.currentL4FallbackRateAuthorityRef.contentHash,
  preparation.currentL4FallbackRateAuthorityRef.contentHash)
assert.equal(attempt.currentA100ServingQuotaAuthorityRef.contentHash,
  preparation.currentA100ServingQuotaAuthorityRef.contentHash)
assert.throws(() => assertCanonicalSam31VertexServingQualificationAttempt({
  ...attempt,
  customerInvocationAuthorized: true,
}))
assert.throws(() => assertCanonicalSam31VertexServingQualificationResult({
  ...unknown,
  automaticRetryAllowed: true,
}))
await assert.rejects(() => service({
  repository: repository(),
  runtimeResponse: null,
  request: async () => { throw new Error('Invalid ref may not call Vertex.') },
}).invokeOne({
  ...request,
  qualificationPreparationRef: {
    ...request.qualificationPreparationRef,
    id: 'sam31-qualification-preparation:wrong-invocation',
  },
}))
await assert.rejects(() => service({
  repository: repository(),
  runtimeResponse: null,
  request: async () => { throw new Error('Invalid digest may not call Vertex.') },
}).invokeOne({
  ...request,
  dispatchAdmissionDigestSha256: '0'.repeat(64),
}))
checks += 8

const wrongWrapperRepository = repository()
const wrongWrapper = await service({
  repository: wrongWrapperRepository,
  runtimeResponse: null,
  request: async () => ({ data: {
    ...wrapper,
    modelDisplayName: 'Wrong Model',
  } }),
}).invokeOne(request)
assert.equal(wrongWrapper.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(wrongWrapper.exactVertexPredictionWrapperReread, false)
checks += 2

assert.equal(checks, 33)
console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-qualification-invocation',
  status: 'passed',
  checks,
  exactVertexWrapperRequired: true,
  exactPrivateRuntimeResponseReread: true,
  singleUseAttemptAndCallStart: true,
  unknownOutcomeBlocksRetry: true,
  providerRoundTripMeasured: true,
  customerInvocationAuthorized: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function service(input: {
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  runtimeResponse: unknown
  request: (request: Record<string, unknown>) => Promise<unknown>
}) {
  let clock = 1_000
  return createCanonicalSam31VertexServingQualificationInvocationService({
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
          deployedModels: [{ id: '3101000001' }],
          trafficSplit: { '3101000001': 100 },
        } }
        return input.request(providerRequest)
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
    now: () => NOW,
    clockMilliseconds: () => { const value = clock; clock += 250; return value },
  })
}

function repository() {
  return createCanonicalSam31VertexServingQualificationInvocationRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/sam31-serving-qualification-invocations',
  })
}

function runtimeResponse() {
  const manifestSha256 = sha256AuthorityValue('serving-mask-manifest')
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
      gpuMemoryProfileId: 'a100_full_gpu_state_v1',
      pastNonConditioningMemoryTrimmedOnGpu: false,
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
      wallTimeMilliseconds: 90_000,
      modelLoadMilliseconds: 15_000,
      promptMilliseconds: 1_000,
      propagationMilliseconds: 65_000,
      outputPersistenceMilliseconds: 9_000,
      cudaEventInferenceMilliseconds: 64_000,
      peakCudaAllocatedBytes: 42_000_000_000,
      peakCudaReservedBytes: 50_000_000_000,
      outputFileCount: 201,
      outputByteLength: 1_800_000_000,
    },
    outputSummary: {
      manifestRef: { id: 'serving-mask-manifest', version: 1,
        contentHash: `sha256:${manifestSha256}` },
      manifestSha256,
      firstFrameIndex: 0,
      lastFrameIndex: 199,
      propagatedFrameCount: 200,
      distinctObjectIds: [0],
      losslessMaskPngCount: 200,
      normalizedBoxRecordCount: 200,
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
