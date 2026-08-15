import assert from 'node:assert/strict'

import {
  assertCanonicalSam31VertexModelVersionRollout,
  createCanonicalSam31VertexModelVersionRolloutService,
  type CanonicalSam31VertexModelVersionRollout,
  type CanonicalSam31VertexModelVersionRolloutRepository,
} from '../services/canonical-sam3_1-vertex-model-version-rollout-service'

const imageUri =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:4e028b571f1f4d493ed884c031ec876961bbb2f66c6794cc26a10c31e705f7b4'
const model = {
  name: 'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@8',
  displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
  versionId: '8',
  versionAliases: ['multi-instance-identity-continuity-candidate'],
  containerSpec: {
    imageUri,
    healthRoute: '/health',
    predictRoute: '/predict',
    ports: [{ containerPort: 8080 }],
    env: [
      {
        name: 'WEEDITPRO_SAM31_RUNTIME_MODE',
        value: 'vertex_prediction_endpoint_v1',
      },
      {
        name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
        value: 'nvidia_a100_80gb',
      },
    ],
  },
}
const operation = {
  name: 'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1/operations/7285392877759234048',
  done: true,
  response: { deployedModel: { id: '3101000018' } },
}
const deployedModel = {
  id: '3101000018',
  model:
    'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@8',
  serviceAccount:
    'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
  enableAccessLogging: false,
  disableContainerLogging: true,
  dedicatedResources: {
    machineSpec: {
      machineType: 'a2-ultragpu-1g',
      acceleratorType: 'NVIDIA_A100_80GB',
      acceleratorCount: 1,
    },
    minReplicaCount: 0,
    initialReplicaCount: 1,
    maxReplicaCount: 1,
    scaleToZeroSpec: {
      minScaleupPeriod: '300s',
      idleScaledownPeriod: '300s',
    },
    spot: false,
  },
}
const endpoint = {
  name: 'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
  dedicatedEndpointEnabled: true,
  deployedModels: [deployedModel],
  trafficSplit: { '3101000018': 100 },
}

const liveVertexEndpointProjection = {
  ...endpoint,
  deployedModels: [{
    ...deployedModel,
    model:
      'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    modelVersionId: '8',
    dedicatedResources: {
      ...deployedModel.dedicatedResources,
      minReplicaCount: undefined,
    },
  }],
}

const valid = await observe({ model, operation, endpoint })
assert.equal(valid.modelVersionId, '8')
assert.equal(valid.deployedModelId, '3101000018')
assert.equal(valid.immutableImageDigest,
  'sha256:4e028b571f1f4d493ed884c031ec876961bbb2f66c6794cc26a10c31e705f7b4')
assert.equal(valid.minimumReplicaCount, 0)
assert.equal(valid.initialReplicaCount, 1)
assert.equal(valid.maximumReplicaCount, 1)
assert.equal(valid.onlyCurrentModelVersionReceivesTraffic, true)
assert.equal(valid.runtimeQualified, false)
assert.equal(valid.productionAuthorityGranted, false)
assert.equal((await observe({
  model,
  operation,
  endpoint: liveVertexEndpointProjection,
})).modelVersionId, '8')

const repeatedRepository = memoryRepository()
const repeatedResponses = [
  model, operation, endpoint, model, operation, endpoint,
]
let repeatedObservationCount = 0
const repeatedService = createCanonicalSam31VertexModelVersionRolloutService({
  auth: {
    request: async () => ({ data: repeatedResponses.shift() }) as never,
  },
  repository: repeatedRepository,
  now: () => repeatedObservationCount++ === 0
    ? '2026-08-12T13:40:00.000Z'
    : '2026-08-12T13:45:00.000Z',
})
const firstRepeated = await repeatedService.observeCurrent()
const secondRepeated = await repeatedService.observeCurrent()
assert.equal(secondRepeated.rolloutHash, firstRepeated.rolloutHash)
assert.equal(secondRepeated.observedAt, firstRepeated.observedAt)

assert.throws(() => assertCanonicalSam31VertexModelVersionRollout({
  ...valid,
  customerCreditsMutated: true,
}))

for (const invalid of [
  { model: { ...model, versionId: '1' }, operation, endpoint },
  {
    model: {
      ...model,
      containerSpec: { ...model.containerSpec, imageUri: `${imageUri}0` },
    },
    operation,
    endpoint,
  },
  {
    model: {
      ...model,
      containerSpec: {
        ...model.containerSpec,
        env: [model.containerSpec.env[0], model.containerSpec.env[0]],
      },
    },
    operation,
    endpoint,
  },
  { model, operation: { ...operation, done: false }, endpoint },
  {
    model,
    operation,
    endpoint: {
      ...endpoint,
      deployedModels: [deployedModel, deployedModel],
    },
  },
  {
    model,
    operation,
    endpoint: { ...endpoint, trafficSplit: { '3101000018': 99 } },
  },
  {
    model,
    operation,
    endpoint: {
      ...endpoint,
      deployedModels: [{
        ...deployedModel,
        dedicatedResources: {
          ...deployedModel.dedicatedResources,
          minReplicaCount: 1,
        },
      }],
    },
  },
]) {
  await assert.rejects(() => observe(invalid))
}

process.stdout.write(`${JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-model-version-rollout',
  checks: 18,
  modelVersionId: valid.modelVersionId,
  deployedModelId: valid.deployedModelId,
  exactModelVersionReread: valid.exactModelVersionReread,
  exactDeployOperationReread: valid.exactDeployOperationReread,
  exactEndpointAndTrafficReread: valid.exactEndpointAndTrafficReread,
  productionReady: false,
})}\n`)

async function observe(responses: {
  readonly model: unknown
  readonly operation: unknown
  readonly endpoint: unknown
}): Promise<CanonicalSam31VertexModelVersionRollout> {
  const repository = memoryRepository()
  const values = [responses.model, responses.operation, responses.endpoint]
  return createCanonicalSam31VertexModelVersionRolloutService({
    auth: {
      request: async () => ({
        data: values.shift(),
      }) as never,
    },
    repository,
    now: () => '2026-08-12T13:40:00.000Z',
  }).observeCurrent()
}

function memoryRepository(): CanonicalSam31VertexModelVersionRolloutRepository {
  let value: CanonicalSam31VertexModelVersionRollout | null = null
  return {
    async persistCreateOnly({ rollout }) {
      if (value !== null) return 'already_exists'
      value = structuredClone(rollout)
      return 'created'
    },
    async reread() {
      return value === null ? null : structuredClone(value)
    },
  }
}
