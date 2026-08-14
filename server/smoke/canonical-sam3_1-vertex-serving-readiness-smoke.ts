import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { GoogleAuth } from 'google-auth-library'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  createCanonicalSam31VertexScaleZeroModelDeployRequest,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31VertexServingDeploymentReadyService,
  createGoogleCloudSam31VertexServingExactDeploymentReadPort,
} from '../services/canonical-sam3_1-vertex-serving-deployment-ready-service'
import {
  createCanonicalSam31VertexServingDeploymentReadyRepository,
} from '../services/canonical-sam3_1-vertex-serving-deployment-ready-repository'
import {
  assertCanonicalSam31VertexServingDeploymentReady,
} from '../services/canonical-sam3_1-vertex-serving-invocation-service'
import {
  assertCanonicalSam31VertexServingReadinessProbe,
  createCanonicalSam31VertexServingReadinessProbeRepository,
  createCanonicalSam31VertexServingReadinessProbeService,
} from '../services/canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_RESOURCE,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'

const imageDigest = hash('serving-image')
const runtimeReleaseRef = ref('sam31-a100-runtime-release')
const imageSupplyChainReleaseRef = ref('sam31-supply-chain-release')
const readinessTriggerRef = ref('user-trigger-readiness-1')
const endpointDeploymentRef = ref('endpoint-deployment-candidate')
const values = new Map<string, Buffer>()
const repository = createCanonicalSam31VertexServingReadinessProbeRepository({
  objectPort: memoryObjectPort(values),
  prefix: 'private/test/sam31-readiness',
})
let time = 0
let probeRequests = 0
const dedicatedEndpointDns =
  'weeditpro-sam31-a100-scale-zero-v1.us-central1-123456.prediction.vertexai.goog'
const dedicatedEndpointResponse = {
  name:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
  displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
  dedicatedEndpointEnabled: true,
  dedicatedEndpointDns,
  deployedModels: [{
    id: '3101000006',
    model:
      'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    modelVersionId: '3',
  }],
  trafficSplit: { '3101000006': 100 },
}
const readyResponse = (requestBody: unknown) => {
  const body = requestBody as {
    instances: [{ readinessProbeId: string }]
  }
  return {
    deployedModelId: '3101000006',
    model:
      'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    modelDisplayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
    modelVersionId: '3',
    predictions: [{
      schemaVersion: 'canonical-sam3_1-vertex-readiness-result-v1',
      readinessProbeId: body.instances[0].readinessProbeId,
      serverVersion: 'canonical-sam3_1-vertex-prediction-server-v1',
      acceleratorClass: 'nvidia_a100_80gb',
      nvidiaDeviceNodesPresent: true,
      checkpointByteLength: 3_502_755_717,
      checkpointSha256:
        '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6',
      exactCheckpointBytesRereadAndHashed: true,
      privateCheckpointDownloadPerformedAtReplicaStartup: true,
      readyForCustomerInvocation: true,
      customerInvocationStarted: false,
      modelInferenceExecuted: false,
      storageReadPerformedAtReplicaStartup: true,
      storageWritePerformed: false,
      customerCreditsMutated: false,
      qaApproved: false,
      productionAuthorityGranted: false,
    }],
  }
}
const probeService = createCanonicalSam31VertexServingReadinessProbeService({
  repository,
  auth: {
    async request(request: Record<string, unknown>) {
      if (request.method === 'GET') {
        return { data: dedicatedEndpointResponse }
      }
      probeRequests += 1
      assert.equal(request.retry, false)
      assert.equal(request.maxRedirects, 0)
      if (probeRequests === 1) throw safeScaleFromZero429()
      return { data: readyResponse(request.data) }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  now: () => time === 0
    ? '2026-08-11T22:00:00.000Z'
    : '2026-08-11T22:00:05.000Z',
  clockMilliseconds: () => time,
  wait: async (milliseconds) => { time += milliseconds },
  deadlineMilliseconds: 30_000,
})
const probe = await probeService.warmAndObserve({
  endpointDeploymentRef,
  readinessTriggerRef,
  imageSupplyChainReleaseRef,
  immutableImageDigest: imageDigest,
})
assert.equal(probe.safeDropped429ResponseCount, 1)
assert.equal(probe.totalProbeRequestCount, 2)
assert.equal(probe.customerInvocationStarted, false)
assert.equal(probe.modelInferenceExecuted, false)
assert.equal(probe.storageReadPerformedAtReplicaStartup, true)
assert.equal(probe.storageWritePerformed, false)
assert.equal(probeRequests, 2)
assert.deepEqual(
  assertCanonicalSam31VertexServingReadinessProbe(
    await repository.reread({ readinessProbeId: probe.readinessProbeId }),
  ),
  probe,
)
assert.deepEqual(await probeService.warmAndObserve({
  endpointDeploymentRef,
  readinessTriggerRef,
  imageSupplyChainReleaseRef,
  immutableImageDigest: imageDigest,
}), probe)
assert.equal(probeRequests, 2)

await assert.rejects(() =>
  createCanonicalSam31VertexServingReadinessProbeService({
    repository: createCanonicalSam31VertexServingReadinessProbeRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/test/wrong-429',
    }),
    auth: {
      async request(request: Record<string, unknown>) {
        if (request.method === 'GET') {
          return { data: dedicatedEndpointResponse }
        }
        throw {
          response: {
            status: 429,
            data: { error: {
              code: 429,
              status: 'RESOURCE_EXHAUSTED',
              message: 'unclassified project quota exhausted',
            } },
          },
        }
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
  }).warmAndObserve({
    endpointDeploymentRef,
    readinessTriggerRef: ref('wrong-429-trigger'),
    imageSupplyChainReleaseRef,
    immutableImageDigest: imageDigest,
  }),
)
await assert.rejects(() =>
  createCanonicalSam31VertexServingReadinessProbeService({
    repository: createCanonicalSam31VertexServingReadinessProbeRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/test/unknown',
    }),
    auth: {
      async request(request: Record<string, unknown>) {
        if (request.method === 'GET') {
          return { data: dedicatedEndpointResponse }
        }
        throw new Error('connection reset')
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
  }).warmAndObserve({
    endpointDeploymentRef,
    readinessTriggerRef: ref('unknown-trigger'),
    imageSupplyChainReleaseRef,
    immutableImageDigest: imageDigest,
  }),
)
assert.throws(() => assertCanonicalSam31VertexServingReadinessProbe({
  ...probe,
  modelInferenceExecuted: true,
}))

const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef,
  immutableImageRef: ref('sam31-serving-image', imageDigest.slice(7)),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${imageDigest}`,
  immutableImageDigest: imageDigest,
  sourceCheckpointQualificationRef: {
    ...ref('sam31-source-checkpoint'),
    version: 2,
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
  },
  servingQuotaPreferenceRef: ref('sam31-serving-quota'),
  accountEffectiveRateAuthorityRef: ref('sam31-a100-serving-rate'),
  recordedAt: '2026-08-11T21:55:00.000Z',
})
const modelDeployRequest = createCanonicalSam31VertexScaleZeroModelDeployRequest({
  profile,
  modelResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
})
const deploymentProfileRef = ref('sam31-scale-zero-profile', profile.profileHash)
const modelUploadObservationRef = ref('sam31-model-upload-observation')
const endpointCreateObservationRef = ref('sam31-endpoint-observation')
const modelDeployObservationRef = ref('sam31-model-deploy-observation')
const cloudReads: unknown[] = []
const exactReadPort = createGoogleCloudSam31VertexServingExactDeploymentReadPort({
  auth: {
    async request(request: unknown) {
      cloudReads.push(request)
      const url = (request as { readonly url?: unknown }).url
      assert.equal((request as { readonly retry?: unknown }).retry, false)
      assert.equal((request as { readonly maxRedirects?: unknown })
        .maxRedirects, 0)
      if (typeof url === 'string' && url.includes('/models/')) return { data: {
        name:
          'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
        displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
        containerSpec: {
          imageUri: profile.immutableImageUri,
          ports: [{ containerPort: 8080 }],
          healthRoute: '/health',
          predictRoute: '/predict',
        },
      } }
      return { data: {
        name:
          'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
        displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
        dedicatedEndpointEnabled: true,
        dedicatedEndpointDns,
        predictRequestResponseLoggingConfig: { enabled: false },
        deployedModels: [{
          id: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
          model: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_RESOURCE,
          serviceAccount:
            'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
          disableContainerLogging: true,
          dedicatedResources: {
            machineSpec: {
              machineType: 'a2-ultragpu-1g',
              acceleratorType: 'NVIDIA_A100_80GB',
              acceleratorCount: '1',
            },
            minReplicaCount: '0',
            initialReplicaCount: '1',
            maxReplicaCount: '1',
            scaleToZeroSpec: {
              minScaleupPeriod: '300s',
              idleScaledownPeriod: '300s',
            },
          },
        }],
        trafficSplit: {
          [CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID]: 100,
        },
      } }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
})
const runtimeReleaseReadPort = {
  async rereadQualifiedRuntimeRelease() {
    return {
      runtimeReleaseRef,
      toolId: 'sam3_1',
      operationId: 'tool.sam3_1.segment_and_track_subject.v1',
      routeId: 'a100_80gb_heavy_primary',
      executionTarget:
        'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
      immutableImageDigest: imageDigest,
      qualificationRunCount: 30,
      privateInternalQualified: true,
      exactRuntimeReleaseRegistryReread: true,
    }
  },
}
const ready = await createCanonicalSam31VertexServingDeploymentReadyService({
  exactDeploymentReadPort: exactReadPort,
  runtimeReleaseReadPort,
}).produceOne({
  profile,
  deploymentProfileRef,
  modelUploadObservationRef,
  endpointCreateObservationRef,
  modelDeployObservationRef,
  modelDeployRequest,
  readinessProbeRef: ref('sam31-readiness-probe', probe.probeHash),
  readinessProbe: probe,
  runtimeReleaseRef,
  observedAt: probe.readyObservedAt,
  expiresAt: '2026-08-11T22:02:05.000Z',
})
assert.equal(cloudReads.length, 2)
assert.equal(ready.readyForPrivateInvocation, true)
assert.equal(ready.exactNonCustomerGpuReadinessProbeReread, true)
assert.match(ready.exactDeploymentObservationRef.contentHash,
  /^sha256:[a-f0-9]{64}$/u)
assert.equal(ready.runtimeReleaseRef.contentHash,
  runtimeReleaseRef.contentHash)
assert.equal(ready.immutableImageDigest, imageDigest)
assert.deepEqual(assertCanonicalSam31VertexServingDeploymentReady(
  ready,
  '2026-08-11T22:00:06.000Z',
), ready)
const readyRepository =
  createCanonicalSam31VertexServingDeploymentReadyRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/test/sam31-deployment-ready',
  })
assert.equal(await readyRepository.persistCreateOnly({ ready }), 'created')
assert.deepEqual(await readyRepository.rereadReadyDeployment({
  endpointDeploymentRef: ready.endpointDeploymentRef,
  at: '2026-08-11T22:00:06.000Z',
}), ready)
await assert.rejects(() => readyRepository.rereadReadyDeployment({
  endpointDeploymentRef: ready.endpointDeploymentRef,
  at: ready.expiresAt,
}))
await assert.rejects(() =>
  createCanonicalSam31VertexServingDeploymentReadyService({
    exactDeploymentReadPort: exactReadPort,
    runtimeReleaseReadPort,
  }).produceOne({
    profile,
    deploymentProfileRef,
    modelUploadObservationRef,
    endpointCreateObservationRef,
    modelDeployObservationRef,
    modelDeployRequest,
    readinessProbeRef: ref('wrong-probe', '0'.repeat(64)),
    readinessProbe: probe,
    runtimeReleaseRef,
    observedAt: probe.readyObservedAt,
    expiresAt: '2026-08-11T22:02:05.000Z',
  }),
)
await assert.rejects(() =>
  createCanonicalSam31VertexServingDeploymentReadyService({
    exactDeploymentReadPort: {
      async rereadExactDeployment(request) {
        const exact = await exactReadPort.rereadExactDeployment(request)
        return { ...(exact as Record<string, unknown>),
          maximumReplicaCount: 2 }
      },
    },
    runtimeReleaseReadPort,
  }).produceOne({
    profile,
    deploymentProfileRef,
    modelUploadObservationRef,
    endpointCreateObservationRef,
    modelDeployObservationRef,
    modelDeployRequest,
    readinessProbeRef: ref('sam31-readiness-probe', probe.probeHash),
    readinessProbe: probe,
    runtimeReleaseRef,
    observedAt: probe.readyObservedAt,
    expiresAt: '2026-08-11T22:02:05.000Z',
  }),
)

const extraMetadataProbeState: { retried?: true } = {}
const extraMetadataProbe = await createCanonicalSam31VertexServingReadinessProbeService({
  repository: createCanonicalSam31VertexServingReadinessProbeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/test/google-429-metadata',
  }),
  auth: {
    async request(request: Record<string, unknown>) {
      if (request.method === 'GET') {
        return { data: dedicatedEndpointResponse }
      }
      if (!('retried' in extraMetadataProbeState)) {
        extraMetadataProbeState.retried = true
        const response = safeScaleFromZeroJson429()
        Object.assign(response.response, { headers: { 'retry-after': '5' } })
        Object.assign(response.response.data.error, {
          details: [{ reason: 'MODEL_SCALE_UP' }],
        })
        throw response
      }
      return { data: readyResponse(request.data) }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  now: () => '2026-08-11T22:00:10.000Z',
  clockMilliseconds: () => 0,
  wait: async () => undefined,
}).warmAndObserve({
  endpointDeploymentRef,
  readinessTriggerRef: ref('google-429-metadata-trigger'),
  imageSupplyChainReleaseRef,
  immutableImageDigest: imageDigest,
})
assert.equal(extraMetadataProbe.safeDropped429ResponseCount, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-readiness',
  status: 'passed',
  checks: 31,
  safeScaleFromZero429Count: probe.safeDropped429ResponseCount,
  endpointResourceReads: cloudReads.length,
  readinessPersistedCreateOnly: true,
  exactDeploymentAndTrafficReread: true,
  customerInvocationStarted: false,
  modelInferenceExecuted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function safeScaleFromZero429() {
  return {
    response: {
      status: 429,
      data:
        'Model is not yet ready for inference. Please wait while model completes scale-up from zero, then try your request again.',
    },
  }
}

function safeScaleFromZeroJson429() {
  return {
    response: {
      status: 429,
      data: { error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        message: 'Endpoint model is not ready while scaling from zero.',
      } },
    },
  }
}

function memoryObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      if (objects.has(input.objectPath)) return 'already_exists'
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = objects.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}

function hash(seed: string): `sha256:${string}` {
  return `sha256:${sha256AuthorityValue(seed)}`
}

function ref<const Version extends number = 1>(
  id: string,
  raw = sha256AuthorityValue(id),
  version: Version = 1 as Version,
) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}
