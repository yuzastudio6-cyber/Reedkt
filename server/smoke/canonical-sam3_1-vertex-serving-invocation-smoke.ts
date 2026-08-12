import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { GoogleAuth } from 'google-auth-library'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingInvocationAttempt,
  assertCanonicalSam31VertexServingInvocationResult,
  assertCanonicalSam31VertexServingDeploymentReady,
  canonicalSam31VertexServingDeploymentReadySchema,
  createCanonicalSam31VertexServingInvocationRepository,
  createCanonicalSam31VertexServingInvocationService,
  type CanonicalSam31VertexServingInvocationRepository,
} from '../services/canonical-sam3_1-vertex-serving-invocation-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import type {
  CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  runtimeResponse,
  task,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const at = '2026-08-11T20:00:00.000Z'
const endpointDeploymentRef = ref('sam31-a100-serving-deployment')
const readinessPayload = {
  schemaVersion: 'canonical-sam3_1-vertex-serving-deployment-ready-v1' as const,
  source:
    'canonical_server_vertex_scale_zero_deployment_readiness_owner' as const,
  deploymentProfileRef: ref('sam31-a100-deployment-profile'),
  endpointDeploymentRef,
  exactDeploymentObservationRef: ref('sam31-exact-deployment-observation'),
  runtimeReleaseRef: task.runtimeReleaseRef,
  readinessProbeRef: ref('sam31-a100-readiness-probe'),
  modelUploadObservationRef: ref('sam31-model-upload-observation'),
  endpointCreateObservationRef: ref('sam31-endpoint-create-observation'),
  modelDeployObservationRef: ref('sam31-model-deploy-observation'),
  endpointResourceName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const,
  deployedModelId: '3101000001' as const,
  immutableImageDigest: task.runtimeRequest.modelArtifacts.immutableImageDigest,
  routeId: 'a100_80gb_heavy_primary' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  minimumReplicaCount: 0 as const,
  maximumReplicaCount: 1 as const,
  maximumConcurrentInvocations: 1 as const,
  exactModelEndpointDeploymentAndTrafficReread: true as const,
  exactNonCustomerGpuReadinessProbeReread: true as const,
  readyForPrivateInvocation: true as const,
  customerInvocationStarted: false as const,
  walletOrCreditMutationAuthorityGranted: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt: '2026-08-11T19:59:00.000Z',
  expiresAt: '2026-08-11T20:10:00.000Z',
}
const readiness = canonicalSam31VertexServingDeploymentReadySchema.parse({
  ...readinessPayload,
  readinessHash: sha256AuthorityValue(readinessPayload),
})
const runtimeResponseBytes = Buffer.from(
  canonicalSam31GpuWireStringify(runtimeResponse),
  'utf8',
)
const runtimeResponseHash = createHash('sha256')
  .update(runtimeResponseBytes).digest('hex')
const prediction = {
  schemaVersion: 'canonical-sam3_1-vertex-prediction-result-v1' as const,
  invocationId: task.invocationId,
  runtimeStatus: runtimeResponse.status,
  responseRef: ref('sam31-a100-runtime-response', runtimeResponseHash),
  uploadedObjectCount: runtimeResponse.runtimeMeasurement!.outputFileCount + 2,
  uploadedByteLength:
    runtimeResponse.runtimeMeasurement!.outputByteLength +
    runtimeResponseBytes.byteLength,
  exactPrivateCreateOnlyPersistence: true as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  productionAuthorityGranted: false as const,
}
const invokeRequest = {
  invocationId: task.invocationId,
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
  endpointDeploymentRef,
}

let checks = 0

const successRepository = repository()
let successCalls = 0
const success = await service({
  repository: successRepository,
  runtimeResponse,
  request: async (request) => {
    successCalls += 1
    assert.equal(request.url,
      `${readiness.endpointResourceName.replace('projects/',
        'https://us-central1-aiplatform.googleapis.com/v1/projects/')}:predict`)
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
assert.equal(success.uploadedObjectCount, prediction.uploadedObjectCount)
assert.equal(success.exactPrivateRuntimeResponseReread, true)
assert.equal(successCalls, 1)
checks += 5

const successReplay = await service({
  repository: successRepository,
  runtimeResponse,
  request: async () => {
    throw new Error('A terminal replay must not call Vertex again.')
  },
}).invokeOne(invokeRequest)
assert.equal(successReplay.resultHash, success.resultHash)
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
assert.equal(reconciled.uploadedObjectCount, null)
assert.equal(reconciled.uploadedByteLength, null)
assert.equal(reconciled.providerOutcome, 'executed')
checks += 5

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
assert.equal(unknown.terminalEvidenceMode, 'none_unknown')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(unknown.unresolvedOutcomeBlocksRetry, true)
const unknownReplay = await service({
  repository: unknownRepository,
  runtimeResponse: null,
  request: async () => {
    unknownCalls += 1
    throw new Error('An unknown replay must not call Vertex again.')
  },
}).invokeOne(invokeRequest)
assert.equal(unknownReplay.resultHash, unknown.resultHash)
assert.equal(unknownCalls, 1)
checks += 7

const preCallRepository = repository()
const preCallCrashRepository = Object.freeze({
  ...preCallRepository,
  async persistAttemptCreateOnly(input: Parameters<
    CanonicalSam31VertexServingInvocationRepository[
      'persistAttemptCreateOnly'
    ]
  >[0]) {
    await preCallRepository.persistAttemptCreateOnly(input)
    throw new Error('simulated crash after admission consumption')
  },
})
await assert.rejects(() => service({
  repository: preCallCrashRepository,
  runtimeResponse: null,
  now: '2026-08-11T20:00:01.000Z',
  request: async () => ({ data: { predictions: [prediction] } }),
}).invokeOne(invokeRequest))
let recoveredPreCallCount = 0
let recoveredPreCallResponse: unknown = null
const recoveredPreCall = await service({
  repository: preCallRepository,
  runtimeResponse: () => recoveredPreCallResponse,
  now: '2026-08-11T20:00:02.000Z',
  request: async () => {
    recoveredPreCallCount += 1
    recoveredPreCallResponse = runtimeResponse
    return { data: { predictions: [prediction] } }
  },
}).invokeOne(invokeRequest)
assert.equal(recoveredPreCall.disposition, 'completed')
assert.equal(recoveredPreCallCount, 1)
checks += 3

const postStartRepository = repository()
const postStartCrashRepository = Object.freeze({
  ...postStartRepository,
  async persistCallStartCreateOnly(input: Parameters<
    CanonicalSam31VertexServingInvocationRepository[
      'persistCallStartCreateOnly'
    ]
  >[0]) {
    await postStartRepository.persistCallStartCreateOnly(input)
    throw new Error('simulated crash after provider-call start persistence')
  },
})
await assert.rejects(() => service({
  repository: postStartCrashRepository,
  runtimeResponse: null,
  now: '2026-08-11T20:00:03.000Z',
  request: async () => ({ data: { predictions: [prediction] } }),
}).invokeOne(invokeRequest))
let blockedRetryCalls = 0
const blockedRetry = await service({
  repository: postStartRepository,
  runtimeResponse: null,
  now: '2026-08-11T20:00:04.000Z',
  request: async () => {
    blockedRetryCalls += 1
    return { data: { predictions: [prediction] } }
  },
}).invokeOne(invokeRequest)
assert.equal(blockedRetry.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(blockedRetryCalls, 0)
checks += 3

const attempt = assertCanonicalSam31VertexServingInvocationAttempt(
  await successRepository.rereadAttempt({ invocationId: task.invocationId }),
)
await assert.rejects(async () =>
  assertCanonicalSam31VertexServingInvocationAttempt({
    ...attempt,
    automaticRetryAllowed: true,
  }))
await assert.rejects(async () =>
  assertCanonicalSam31VertexServingInvocationResult({
    ...unknown,
    unresolvedOutcomeBlocksRetry: false,
  }))
await assert.rejects(() => service({
  repository: repository(),
  runtimeResponse,
  request: async () => ({ data: { predictions: [prediction] } }),
  ready: { ...readiness, expiresAt: at },
}).invokeOne(invokeRequest))
let accessorCalls = 0
const accessorReady = { ...readiness }
Object.defineProperty(accessorReady, 'routeId', {
  enumerable: true,
  get() {
    accessorCalls += 1
    return 'a100_80gb_heavy_primary'
  },
})
assert.throws(() => assertCanonicalSam31VertexServingDeploymentReady(
  accessorReady,
  at,
))
assert.equal(accessorCalls, 0)
assert.throws(() => assertCanonicalSam31VertexServingDeploymentReady(
  Object.create(readiness) as unknown,
  at,
))
checks += 6

assert.equal(checks, 31)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-invocation',
  status: 'passed',
  checks,
  successDisposition: success.disposition,
  timeoutDisposition: reconciled.disposition,
  unknownDisposition: unknown.disposition,
  preCallCrashSafeRetryCount: recoveredPreCallCount,
  postCallStartCrashRetryCount: blockedRetryCalls,
  runtimeOrProviderExecuted: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2))

function service(input: {
  repository: CanonicalSam31VertexServingInvocationRepository
  runtimeResponse: unknown | (() => unknown)
  request: (request: Record<string, unknown>) => Promise<unknown>
  ready?: unknown
  now?: string
}) {
  return createCanonicalSam31VertexServingInvocationService({
    taskStore: taskStore(input.runtimeResponse),
    deploymentReadPort: {
      async rereadReadyDeployment() {
        return structuredClone(input.ready ?? readiness)
      },
    },
    repository: input.repository,
    auth: { request: input.request } as unknown as Pick<GoogleAuth, 'request'>,
    now: () => input.now ?? at,
  })
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

function repository(): CanonicalSam31VertexServingInvocationRepository {
  const values = new Map<string, Buffer>()
  const objectPort: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const current = values.get(input.objectPath)
      if (current) return 'already_exists'
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = values.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
  return createCanonicalSam31VertexServingInvocationRepository({
    objectPort,
    prefix: 'private/test/sam31-serving-invocations',
  })
}

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}

assert.equal(stableAuthorityStringify(readiness).includes('https://'), false)
