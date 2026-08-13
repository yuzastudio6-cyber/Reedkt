import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type { GoogleAuth } from 'google-auth-library'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  sealCanonicalSam31CurrentA100CustomerDispatchReadiness,
} from '../services/canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  assertCanonicalSam31CurrentVertexCustomerInvocationAttempt,
  assertCanonicalSam31CurrentVertexCustomerInvocationResult,
  createCanonicalSam31CurrentVertexCustomerInvocationRepository,
  createCanonicalSam31CurrentVertexCustomerInvocationService,
  type CanonicalSam31CurrentVertexCustomerInvocationRepository,
} from '../services/canonical-sam3_1-current-vertex-serving-invocation-service'
import {
  canonicalSam31VertexDedicatedPredictionRouteRef,
  rereadCanonicalSam31VertexDedicatedPredictionRoute,
} from '../services/canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  buildCanonicalSam31GpuRuntimeRequest,
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  runtimeResponse as historicalRuntimeResponse,
  task as historicalTask,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const at = '2026-08-12T23:05:00.000Z'
const dedicatedEndpointDns =
  'weeditpro-sam31-a100-scale-zero-v1.us-central1-123456.prediction.vertexai.goog'

const {
  requestBindingSha256: _historicalRequestBinding,
  ...historicalRequestPayload
} = historicalTask.runtimeRequest
void _historicalRequestBinding
const runtimeRequest = buildCanonicalSam31GpuRuntimeRequest({
  ...historicalRequestPayload,
  modelArtifacts: {
    ...historicalRequestPayload.modelArtifacts,
    immutableImageReleaseRef: {
      ...historicalRequestPayload.modelArtifacts.immutableImageReleaseRef,
      contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
    },
    immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  },
})
const runtimeRequestContentSha256 = sha256AuthorityValue(runtimeRequest)
const {
  taskRecordHash: _historicalTaskHash,
  ...historicalTaskPayload
} = historicalTask
void _historicalTaskHash
const taskPayload = {
  ...historicalTaskPayload,
  runtimeRequest,
  runtimeRequestContentSha256,
  runtimeRequestRef: {
    ...historicalTask.runtimeRequestRef,
    contentHash: `sha256:${runtimeRequestContentSha256}` as const,
  },
}
const task = assertCanonicalSam31GpuTaskRecord({
  ...taskPayload,
  taskRecordHash: sha256AuthorityValue(taskPayload),
})
const {
  responseBindingSha256: _historicalResponseBinding,
  ...historicalResponsePayload
} = historicalRuntimeResponse
void _historicalResponseBinding
const runtimeResponse = buildCanonicalSam31GpuRuntimeResponse({
  ...historicalResponsePayload,
  requestBindingSha256: runtimeRequest.requestBindingSha256,
})
const runtimeResponseBytes = Buffer.from(
  canonicalSam31GpuWireStringify(runtimeResponse),
  'utf8',
)
const runtimeResponseHash = createHash('sha256')
  .update(runtimeResponseBytes).digest('hex')

const routeAuth = auth(async () => {
  throw new Error('Route construction must not call prediction.')
})
const route = await rereadCanonicalSam31VertexDedicatedPredictionRoute({
  auth: routeAuth,
})
const routeRef = canonicalSam31VertexDedicatedPredictionRouteRef(route)
const readiness = sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
  schemaVersion:
    'canonical-sam3_1-current-a100-customer-dispatch-readiness-v1',
  source:
    'canonical_server_sam31_current_a100_customer_dispatch_readiness_owner',
  evidenceClass: 'canonical_private_reread',
  status: 'ready_for_private_customer_dispatch',
  readinessId: 'sam31-current-customer-invocation-smoke-readiness',
  routeId: 'a100_80gb_heavy_primary',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
  executionTarget:
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  endpointResourceName: route.endpointResourceName,
  deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  runtimeReleaseRef: task.runtimeReleaseRef,
  rateAuthorityRef: task.primaryRateAuthorityRef,
  endpointRouteRef: routeRef,
  endpointCapacityObservationRef: ref('sam31-endpoint-capacity'),
  a100ServingQuotaObservationRef: ref('sam31-a100-quota'),
  thirtyRunQualificationRef: ref('sam31-a100-thirty-run'),
  completeSourceP95QualificationRef: ref('sam31-a100-p95'),
  independentMaskQualityQualificationRef: ref('sam31-a100-quality'),
  multiReplicaCostAuthorityRef: ref('sam31-a100-multi-cost'),
  maximumReplicaCount: 16,
  maximumConcurrentInvocations: 16,
  minimumReplicaCount: 0,
  thirtyRunQualificationCount: 30,
  completeEightMinuteSourceRunCount: 5,
  exactCurrentEndpointModelVersionTrafficAndCapacityReread: true,
  exactRuntimeReleaseRateQuotaAndQualificationReread: true,
  completeSourceP95AtOrBelowEightMinutes: true,
  independentMaskQualityAccepted: true,
  scaleFromZeroAndReturnToZeroVerified: true,
  accountEffectiveMultiReplicaCostSettlementReady: true,
  privateCustomerDispatchAllowed: true,
  publicProductionDispatchAllowed: false,
  callerOrPlanSelfAttestedReadinessAccepted: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  observedAt: '2026-08-12T23:00:00.000Z',
  expiresAt: '2026-08-12T23:15:00.000Z',
})
const prediction = {
  schemaVersion: 'canonical-sam3_1-vertex-prediction-result-v1' as const,
  invocationId: task.invocationId,
  runtimeStatus: runtimeResponse.status,
  responseRef: ref('sam31-current-a100-runtime-response', runtimeResponseHash),
  uploadedObjectCount: runtimeResponse.runtimeMeasurement!.outputFileCount + 2,
  uploadedByteLength:
    runtimeResponse.runtimeMeasurement!.outputByteLength
      + runtimeResponseBytes.byteLength,
  exactPrivateCreateOnlyPersistence: true as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  productionAuthorityGranted: false as const,
}
const invokeRequest = {
  invocationId: task.invocationId,
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
}

let checks = 0

const successRepository = repository()
let successCalls = 0
const success = await service({
  repository: successRepository,
  runtimeResponse,
  request: async (request) => {
    successCalls += 1
    assert.equal(request.url, route.predictUrl)
    assert.equal(request.retry, false)
    assert.equal(request.maxRedirects, 0)
    assert.deepEqual(request.data, {
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
    return { data: { predictions: [prediction] } }
  },
}).invokeOne(invokeRequest)
assert.equal(success.disposition, 'completed')
assert.equal(success.terminalEvidenceMode,
  'provider_prediction_and_private_response')
assert.equal(success.providerOutcome, 'executed')
assert.equal(success.exactPrivateRuntimeResponseReread, true)
assert.equal(success.exactVertexPredictionWrapperReread, true)
assert.equal(successCalls, 1)
checks += 6

const replay = await service({
  repository: successRepository,
  runtimeResponse,
  request: async () => {
    throw new Error('Terminal replay must not call Vertex.')
  },
}).invokeOne(invokeRequest)
assert.equal(replay.resultHash, success.resultHash)
assert.equal(successCalls, 1)
checks += 2

const timeoutRepository = repository()
const reconciled = await service({
  repository: timeoutRepository,
  runtimeResponse,
  request: async () => {
    throw new Error('simulated transport timeout')
  },
}).invokeOne(invokeRequest)
assert.equal(reconciled.disposition, 'completed')
assert.equal(reconciled.terminalEvidenceMode,
  'private_response_reconciliation')
assert.equal(reconciled.providerOutcome, 'executed')
assert.equal(reconciled.exactVertexPredictionWrapperReread, false)
checks += 4

const scaleZero = await service({
  repository: repository(),
  runtimeResponse: null,
  request: async () => {
    throw {
      response: {
        status: 429,
        data: 'Model is not yet ready for inference. Please wait while model completes scale-up from zero, then try your request again.',
      },
    }
  },
}).invokeOne(invokeRequest)
assert.equal(scaleZero.disposition,
  'not_executed_scale_from_zero_trigger')
assert.equal(scaleZero.providerOutcome, 'not_executed')
assert.equal(
  scaleZero.knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation,
  true,
)
assert.equal(scaleZero.automaticRetryAllowed, false)
checks += 4

const unknownRepository = repository()
let unknownCalls = 0
const unknown = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => {
    unknownCalls += 1
    throw new Error('simulated unknowable provider outcome')
  },
}).invokeOne(invokeRequest)
assert.equal(unknown.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.unresolvedOutcomeBlocksRetry, true)
const unknownReplay = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => {
    unknownCalls += 1
    return { data: { predictions: [prediction] } }
  },
}).invokeOne(invokeRequest)
assert.equal(unknownReplay.resultHash, unknown.resultHash)
assert.equal(unknownCalls, 1)
checks += 5

const preCallRepository = repository()
const crashAfterConsumption = Object.freeze({
  ...preCallRepository,
  async persistAttemptCreateOnly(input: Parameters<
    CanonicalSam31CurrentVertexCustomerInvocationRepository[
      'persistAttemptCreateOnly'
    ]
  >[0]) {
    await preCallRepository.persistAttemptCreateOnly(input)
    throw new Error('simulated crash after durable admission consumption')
  },
})
await assert.rejects(() => service({
  repository: crashAfterConsumption,
  runtimeResponse: null,
  now: '2026-08-12T23:05:01.000Z',
  request: async () => ({ data: { predictions: [prediction] } }),
}).invokeOne(invokeRequest))
let recoveredCalls = 0
let recoveredRuntime: unknown = null
const recovered = await service({
  repository: preCallRepository,
  runtimeResponse: () => recoveredRuntime,
  now: '2026-08-12T23:05:02.000Z',
  request: async () => {
    recoveredCalls += 1
    recoveredRuntime = runtimeResponse
    return { data: { predictions: [prediction] } }
  },
}).invokeOne(invokeRequest)
assert.equal(recovered.disposition, 'completed')
assert.equal(recoveredCalls, 1)
checks += 3

const postStartRepository = repository()
const crashAfterCallStart = Object.freeze({
  ...postStartRepository,
  async persistCallStartCreateOnly(input: Parameters<
    CanonicalSam31CurrentVertexCustomerInvocationRepository[
      'persistCallStartCreateOnly'
    ]
  >[0]) {
    await postStartRepository.persistCallStartCreateOnly(input)
    throw new Error('simulated crash after provider call-start')
  },
})
await assert.rejects(() => service({
  repository: crashAfterCallStart,
  runtimeResponse: null,
  now: '2026-08-12T23:05:03.000Z',
  request: async () => ({ data: { predictions: [prediction] } }),
}).invokeOne(invokeRequest))
let blockedRetryCalls = 0
const blocked = await service({
  repository: postStartRepository,
  runtimeResponse: null,
  now: '2026-08-12T23:05:04.000Z',
  request: async () => {
    blockedRetryCalls += 1
    return { data: { predictions: [prediction] } }
  },
}).invokeOne(invokeRequest)
assert.equal(blocked.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(blockedRetryCalls, 0)
checks += 3

const attempt = assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(
  await successRepository.rereadAttempt({ invocationId: task.invocationId }),
)
assert.throws(() =>
  assertCanonicalSam31CurrentVertexCustomerInvocationAttempt({
    ...attempt,
    automaticRetryAllowed: true,
  }))
assert.throws(() => assertCanonicalSam31CurrentVertexCustomerInvocationResult({
  ...unknown,
  unresolvedOutcomeBlocksRetry: false,
}))
await assert.rejects(() => service({
  repository: repository(),
  runtimeResponse,
  ready: { ...readiness, expiresAt: at },
  request: async () => ({ data: { predictions: [prediction] } }),
}).invokeOne(invokeRequest))
let accessorCalls = 0
const accessorRequest = { ...invokeRequest }
Object.defineProperty(accessorRequest, 'invocationId', {
  enumerable: true,
  get() {
    accessorCalls += 1
    return task.invocationId
  },
})
await assert.rejects(() => service({
  repository: repository(),
  runtimeResponse,
  request: async () => ({ data: { predictions: [prediction] } }),
}).invokeOne(accessorRequest))
assert.equal(accessorCalls, 0)
checks += 5

assert.equal(checks, 32)
assert.equal(stableAuthorityStringify(readiness).includes('https://'), false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-current-vertex-serving-invocation',
  status: 'passed',
  checks,
  currentDeployedModelId:
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  currentModelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  completedDisposition: success.disposition,
  timeoutDisposition: reconciled.disposition,
  scaleZeroDisposition: scaleZero.disposition,
  unknownDisposition: unknown.disposition,
  preCallCrashSafeRetryCount: recoveredCalls,
  postCallStartCrashRetryCount: blockedRetryCalls,
  providerOrGpuRuntimeExecuted: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2))

function service(input: {
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  runtimeResponse: unknown | (() => unknown)
  request: (request: Record<string, unknown>) => Promise<unknown>
  ready?: unknown
  now?: string
}) {
  return createCanonicalSam31CurrentVertexCustomerInvocationService({
    taskStore: taskStore(input.runtimeResponse),
    currentReadinessReadPort: {
      async rereadCurrent(request) {
        assert.equal(request.toolId, 'sam3_1')
        assert.equal(request.operationId,
          'tool.sam3_1.segment_and_track_subject.v1')
        return structuredClone(input.ready ?? readiness)
      },
    },
    repository: input.repository,
    auth: auth(input.request),
    now: () => input.now ?? at,
    clockMilliseconds: clock([1_000, 1_125]),
  })
}

function auth(
  predictionRequest: (request: Record<string, unknown>) => Promise<unknown>,
) {
  return {
    async request(request: Record<string, unknown>) {
      if (request.method === 'GET') return { data: {
        name: CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE,
        displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
        dedicatedEndpointEnabled: true,
        dedicatedEndpointDns,
        deployedModels: [{
          id: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
          model: CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
          modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
        }],
        trafficSplit: {
          [CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID]: 100,
        },
      } }
      return predictionRequest(request)
    },
  } as unknown as Pick<GoogleAuth, 'request'>
}

function taskStore(
  response: unknown | (() => unknown),
): CanonicalSam31GpuTaskStore {
  return Object.freeze({
    schemaVersion: 'canonical-sam3_1-gpu-task-store-v1' as const,
    evidenceClass: 'gcs_generation_create_only_sam3_1_task_store' as const,
    async persistTaskCreateOnly() {
      throw new Error('Invocation owner must not persist task authority.')
    },
    async rereadTask(invocationId: string) {
      assert.equal(invocationId, task.invocationId)
      return structuredClone(task)
    },
    async rereadRuntimeResponse(invocationId: string) {
      assert.equal(invocationId, task.invocationId)
      return structuredClone(
        typeof response === 'function' ? response() : response,
      )
    },
  })
}

function repository():
CanonicalSam31CurrentVertexCustomerInvocationRepository {
  const values = new Map<string, Buffer>()
  const objectPort: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      if (values.has(input.objectPath)) return 'already_exists'
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = values.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
  return createCanonicalSam31CurrentVertexCustomerInvocationRepository({
    objectPort,
    prefix: 'private/test/sam31-current-vertex-customer-invocations',
  })
}

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}

function clock(values: readonly number[]) {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]!
}
