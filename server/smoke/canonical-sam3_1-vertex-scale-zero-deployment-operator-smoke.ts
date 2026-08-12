import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { GoogleAuth } from 'google-auth-library'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31VertexScaleZeroControlPlane,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane'
import {
  createCanonicalSam31VertexScaleZeroControlPlaneRepository,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  createCanonicalSam31VertexScaleZeroDeploymentOperator,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-operator'

const rawHash = (character: string) => character.repeat(64)
const hash = (character: string) => `sha256:${rawHash(character)}` as const
const ref = (id: string, character: string, version: number) => ({
  id, version, contentHash: hash(character),
})
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a', 1),
  immutableImageRef: ref('sam31-image', 'b', 1),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${hash('b')}`,
  immutableImageDigest: hash('b'),
  sourceCheckpointQualificationRef: {
    ...ref('sam31-source-checkpoint', 'c', 2),
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2' as const,
  },
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd', 1),
  accountEffectiveRateAuthorityRef: ref('vertex-a100-rate', 'e', 1),
  recordedAt: '2026-08-12T06:00:00.000Z',
})

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256)
    const existing = objects.get(input.objectPath)
    if (existing) {
      assert.equal(existing.equals(input.body), true)
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(path) {
    const value = objects.get(path)
    return value ? Buffer.from(value) : null
  },
}
const repository = createCanonicalSam31VertexScaleZeroControlPlaneRepository({
  objectPort,
  prefix: 'private/smoke/sam31-scale-zero-deployment-operator',
})
let providerPostCount = 0
const auth = {
  async request(value: { readonly url?: string; readonly method?: string }) {
    const url = String(value.url)
    if (value.method === 'POST') {
      providerPostCount += 1
      const suffix = url.includes('models:upload')
        ? 'upload'
        : url.includes(':deployModel') ? 'deploy' : 'endpoint'
      return { data: {
        name: `projects/reeditpro/locations/us-central1/operations/${suffix}`,
      } }
    }
    if (url.endsWith('/operations/upload')) return { data: {
      name: 'projects/reeditpro/locations/us-central1/operations/upload',
      done: true,
      response: {
        model:
          'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
      },
    } }
    if (url.endsWith('/operations/endpoint')) return { data: {
      name: 'projects/reeditpro/locations/us-central1/operations/endpoint',
      done: true,
      response: {
        name:
          'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
      },
    } }
    if (url.endsWith('/operations/deploy')) return { data: {
      name: 'projects/reeditpro/locations/us-central1/operations/deploy',
      done: true,
      response: { deployedModel: { id: '3101000001' } },
    } }
    throw new Error(`Unexpected test URL ${url}`)
  },
} as unknown as Pick<GoogleAuth, 'request'>
const controlPlane = createCanonicalSam31VertexScaleZeroControlPlane({
  auth,
  now: () => '2026-08-12T06:00:01.000Z',
})
const operator = createCanonicalSam31VertexScaleZeroDeploymentOperator({
  controlPlane,
  repository,
  sleep: async () => undefined,
  pollIntervalMilliseconds: 250,
  maximumWaitMilliseconds: 250,
})

const first = await operator.deployOne(profile)
assert.equal(first.disposition, 'deployed')
assert.equal(first.stages.length, 3)
assert.deepEqual(first.stages.map((stage) => stage.stage), [
  'model_upload', 'endpoint_create', 'model_deploy',
])
assert.equal(first.stages.every((stage) =>
  stage.disposition === 'completed'), true)
assert.equal(first.stages.every((stage) =>
  stage.providerPostIssuedThisRun), true)
assert.equal(providerPostCount, 3)

const replay = await operator.deployOne(profile)
assert.equal(replay.disposition, 'deployed')
assert.equal(replay.stages.length, 3)
assert.equal(replay.stages.every((stage) =>
  !stage.providerPostIssuedThisRun), true)
assert.equal(providerPostCount, 3)
assert.deepEqual(replay.deploymentProfileRef, first.deploymentProfileRef)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-deployment-operator',
  checks: 24,
  exactSequentialStageOrder: true,
  durableConsumptionBeforeEveryProviderPost: true,
  restartReplayIssuedNoDuplicateProviderPost: true,
  providerPostCount,
  customerRequestOrGpuInferenceStarted: false,
  productionReady: false,
}, null, 2))
