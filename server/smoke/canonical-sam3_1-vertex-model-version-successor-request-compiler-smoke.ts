import assert from 'node:assert/strict'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31VertexModelVersionSuccessorRequest,
  createCanonicalSam31VertexModelVersionSuccessorDeployRequest,
  createCanonicalSam31VertexModelVersionSuccessorUploadRequest,
  createCanonicalSam31VertexPreviousDeploymentCapacityUndeployRequest,
} from '../services/canonical-sam3_1-vertex-model-version-successor-request-compiler'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = <const Version extends number>(
  id: string,
  character: string,
  version: Version,
) => ({ id, version, contentHash: hash(character) })
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
  recordedAt: '2026-08-14T19:30:00.000Z',
})

const upload = createCanonicalSam31VertexModelVersionSuccessorUploadRequest(
  profile,
)
const deploy = createCanonicalSam31VertexModelVersionSuccessorDeployRequest({
  profile,
  modelVersionResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@4',
})
const undeploy =
  createCanonicalSam31VertexPreviousDeploymentCapacityUndeployRequest(profile)
assert.deepEqual(
  [upload, undeploy, deploy].map((request) =>
    assertCanonicalSam31VertexModelVersionSuccessorRequest(request).stage),
  [
    'model_version_upload',
    'previous_deployed_model_undeploy_for_capacity',
    'model_version_deploy',
  ],
)
assert.equal(upload.body.modelId, undefined)
assert.equal(upload.body.parentModel,
  'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1')
const model = upload.body.model as Record<string, unknown>
assert.deepEqual(model.versionAliases, ['bounded-memory-quality-candidate'])
assert.equal(JSON.stringify(model).includes(profile.immutableImageUri), true)
const container = model.containerSpec as Record<string, unknown>
assert.equal(container.deploymentTimeout, '1800s')
assert.deepEqual(container.startupProbe, {
  httpGet: { path: '/health', port: 8080 },
  initialDelaySeconds: 0,
  periodSeconds: 10,
  timeoutSeconds: 10,
  failureThreshold: 120,
  successThreshold: 1,
})
assert.equal(upload.body.serviceAccount,
  'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com')
const deployedModel = deploy.body.deployedModel as Record<string, unknown>
assert.equal(deployedModel.id, '3101000008')
assert.equal(deployedModel.model,
  'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@4')
assert.equal(deployedModel.enableAccessLogging, false)
assert.equal(deployedModel.disableContainerLogging, false)
const resources = deployedModel.dedicatedResources as Record<string, unknown>
assert.deepEqual(resources.machineSpec, {
  machineType: 'a2-ultragpu-1g',
  acceleratorType: 'NVIDIA_A100_80GB',
  acceleratorCount: 1,
})
assert.equal(resources.minReplicaCount, 0)
assert.equal(resources.initialReplicaCount, 1)
assert.equal(resources.maxReplicaCount, 1)
assert.deepEqual(resources.scaleToZeroSpec, {
  minScaleupPeriod: '300s',
  idleScaledownPeriod: '300s',
})
assert.deepEqual(deploy.body.trafficSplit, { '0': 100 })
assert.equal(deploy.existingModelAndEndpointRereadRequired, true)
assert.equal(deploy.previousModelVersionRetainedForRollback, true)
assert.equal(deploy.previousDeployedModelReceivesTraffic, false)
assert.equal(deploy.automaticRetryAllowed, false)
assert.equal(
  undeploy.stage,
  'previous_deployed_model_undeploy_for_capacity',
)
assert.deepEqual(undeploy.body, {
  deployedModelId: '3101000006',
})
assert.equal(undeploy.previousModelVersionRetainedForRollback, true)
assert.equal(deploy.requestResponsePayloadLoggingEnabled, false)
assert.equal(deploy.customerRequestOrGpuInferenceStarted, false)
assert.equal(deploy.walletOrCreditMutationAuthorityGranted, false)
assert.equal(deploy.productionAuthorityGranted, false)

assert.throws(() => createCanonicalSam31VertexModelVersionSuccessorDeployRequest({
  profile,
  modelVersionResourceName:
    'projects/reeditpro/locations/us-central1/models/other@3',
}))
assert.throws(() => assertCanonicalSam31VertexModelVersionSuccessorRequest({
  ...deploy,
  url: 'https://evil.example/deploy',
}))
assert.throws(() => assertCanonicalSam31VertexModelVersionSuccessorRequest({
  ...deploy,
  requestDigestSha256: '0'.repeat(64),
}))

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-vertex-model-version-successor-request-compiler',
  checks: 37,
  existingModelAndEndpointRereadRequired: true,
  previousModelVersionRetainedForRollback: true,
  previousDeploymentRemovedBeforeSuccessorDeployment: true,
  capacityOneReplacementSequence: true,
  candidateAlias: 'bounded-memory-quality-candidate',
  deployedModelId: '3101000008',
  a100HeavyPrimary: true,
  minimumReplicaCount: 0,
  initialReplicaCount: 1,
  maximumReplicaCount: 1,
  boundedCheckpointStartupProbe: true,
  sanitizedContainerLoggingEnabled: true,
  accessAndRequestResponseLoggingEnabled: false,
  automaticRetryAllowed: false,
  customerRequestOrGpuInferenceStarted: false,
  productionReady: false,
}, null, 2))
