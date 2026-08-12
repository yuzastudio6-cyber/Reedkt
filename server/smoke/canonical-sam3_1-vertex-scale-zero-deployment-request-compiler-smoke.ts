import assert from 'node:assert/strict'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31VertexScaleZeroDeploymentRequest,
  createCanonicalSam31VertexScaleZeroFoundationRequests,
  createCanonicalSam31VertexScaleZeroModelDeployRequest,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = (id: string, character: string, version: number) => ({
  id,
  version,
  contentHash: hash(character),
})
const imageDigest = hash('b')
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a', 1),
  immutableImageRef: ref('sam31-image', 'b', 1),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${imageDigest}`,
  immutableImageDigest: imageDigest,
  sourceCheckpointQualificationRef: {
    ...ref('sam31-source-checkpoint', 'c', 2),
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2' as const,
  },
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd', 2),
  accountEffectiveRateAuthorityRef: ref('vertex-a100-rate', 'e', 7),
  recordedAt: '2026-08-11T18:30:00.000Z',
})

const [upload, endpoint] =
  createCanonicalSam31VertexScaleZeroFoundationRequests(profile)
const deploy = createCanonicalSam31VertexScaleZeroModelDeployRequest({
  profile,
  modelResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
})
assert.deepEqual(
  [upload, endpoint, deploy].map((item) =>
    assertCanonicalSam31VertexScaleZeroDeploymentRequest(item).stage),
  ['model_upload', 'endpoint_create', 'model_deploy'],
)
assert.equal(upload.url.includes('/v1beta1/'), true)
assert.equal(upload.body.modelId, 'weeditpro-sam31-a100-scale-zero-v1')
assert.equal(JSON.stringify(upload.body).includes(profile.immutableImageUri), true)
assert.equal(JSON.stringify(upload.body).includes('/predict'), true)
assert.equal(JSON.stringify(upload.body).includes('/health'), true)
assert.equal(endpoint.body.dedicatedEndpointEnabled, true)
assert.equal(endpoint.body.predictRequestResponseLoggingConfig, undefined)
const deployedModel = deploy.body.deployedModel as Record<string, unknown>
const dedicatedResources = deployedModel.dedicatedResources as Record<
  string,
  unknown
>
assert.equal(deployedModel.serviceAccount,
  'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(deployedModel.id, '3101000001')
assert.equal(dedicatedResources.minReplicaCount, 0)
assert.equal(dedicatedResources.initialReplicaCount, 1)
assert.equal(dedicatedResources.maxReplicaCount, 1)
assert.deepEqual(dedicatedResources.scaleToZeroSpec, {
  minScaleupPeriod: '300s',
  idleScaledownPeriod: '300s',
})
assert.equal(JSON.stringify(deploy.body).includes('NVIDIA_A100_80GB'), true)
assert.deepEqual(deploy.body.trafficSplit, { '0': 100 })
assert.equal(deploy.customerRequestOrGpuInferenceStarted, false)
assert.equal(deploy.productionAuthorityGranted, false)

assert.throws(() => createCanonicalSam31VertexScaleZeroModelDeployRequest({
  profile,
  modelResourceName: 'projects/other/locations/us-central1/models/sam31',
}))
assert.throws(() => assertCanonicalSam31VertexScaleZeroDeploymentRequest({
  ...deploy,
  url: 'https://evil.example/v1beta1/deploy',
}))
assert.throws(() => assertCanonicalSam31VertexScaleZeroDeploymentRequest({
  ...deploy,
  requestDigestSha256: '0'.repeat(64),
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-deployment-request-compiler',
  checks: 22,
  vertexControlPlaneApiVersion: 'v1beta1',
  dedicatedA100Endpoint: true,
  minimumReplicaCount: 0,
  initialReplicaCount: 1,
  exactScaleToZeroSpec: true,
  callerCloudResourceSelectionAccepted: false,
  customerRequestOrGpuInferenceStarted: false,
  productionReady: false,
}, null, 2))
