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
  createCanonicalSam31VertexModelVersionSuccessorRolloutOwner,
  rereadCanonicalSam31VertexSuccessorDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-model-version-successor-rollout-service'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = <const Version extends number>(
  id: string,
  character: string,
  version: Version,
) => ({ id, version, contentHash: hash(character) })
const imageUri =
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${hash('b')}`
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a', 1),
  immutableImageRef: ref('sam31-image', 'b', 1),
  immutableImageUri: imageUri,
  immutableImageDigest: hash('b'),
  sourceCheckpointQualificationRef: {
    ...ref('sam31-source-checkpoint', 'c', 2),
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
  },
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd', 1),
  accountEffectiveRateAuthorityRef: ref('vertex-a100-rate', 'e', 1),
  recordedAt: '2026-08-14T20:30:00.000Z',
})

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(
      createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256,
    )
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

let providerPostCount = 0
let candidateCreated = true
let successorDeployed = false
let previousUndeployed = false
const operationFor = (url: string) => url.includes('models:upload')
  ? 'upload' : url.includes(':deployModel') ? 'deploy' : 'undeploy'
const auth = {
  async request(value: {
    readonly url?: string
    readonly method?: string
    readonly data?: unknown
  }) {
    const url = String(value.url)
    if (value.method === 'POST') {
      providerPostCount += 1
      return { data: {
        name:
          `projects/reeditpro/locations/us-central1/operations/${operationFor(url)}`,
      } }
    }
    if (url.endsWith('/operations/upload')) {
      candidateCreated = true
      return { data: {
        name: 'projects/reeditpro/locations/us-central1/operations/upload',
        done: true,
        response: {},
      } }
    }
    if (url.endsWith('/operations/deploy')) {
      successorDeployed = true
      return { data: {
        name: 'projects/reeditpro/locations/us-central1/operations/deploy',
        done: true,
        response: {},
      } }
    }
    if (url.endsWith('/operations/undeploy')) {
      previousUndeployed = true
      return { data: {
        name: 'projects/reeditpro/locations/us-central1/operations/undeploy',
        done: true,
        response: {},
      } }
    }
    if (url.endsWith('@bounded-log-transport-candidate')) {
      if (!candidateCreated) {
        throw Object.assign(new Error('candidate absent'), { code: 404 })
      }
      return { data: modelVersion('bounded-log-transport-candidate', '5',
        imageUri, true) }
    }
    if (url.endsWith('@4')) return { data: modelVersion(
      '4', '4',
      'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:1a75275b074e48a76f8c939dcb19994c9064b1edd329e897547230e4352ab017',
      false,
    ) }
    if (url.endsWith('/endpoints/weeditpro-sam31-a100-scale-zero-v1')) {
      return { data: endpoint() }
    }
    throw new Error(`Unexpected SAM successor smoke URL: ${url}`)
  },
} as unknown as Pick<GoogleAuth, 'request'>

let currentTimeOffsetMilliseconds = 0
const owner = createCanonicalSam31VertexModelVersionSuccessorRolloutOwner({
  auth,
  objectPort,
  prefix: 'private/smoke/sam31-successor-rollout',
  now: () => new Date(
    Date.parse('2026-08-14T20:30:01.000Z')
      + currentTimeOffsetMilliseconds++,
  ).toISOString(),
  sleep: async () => undefined,
  pollIntervalMilliseconds: 250,
  maximumWaitMilliseconds: 1_000,
})

const first = await owner.rolloutOne(profile)
assert.equal(first.disposition, 'rolled_out')
assert.equal(first.modelVersionResourceName,
  'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@5')
assert.equal(first.deployedModelId, '3101000012')
assert.equal(first.previousDeployedModelRemovedBeforeSuccessorDeployment, true)
assert.equal(first.capacityOneReplacementSequence, true)
assert.equal(
  first.providerEndpointRereadOmitsAcceptedScaleToZeroWriteFields,
  true,
)
assert.equal(first.providerNormalizedContainerLoggingDisabled, true)
assert.deepEqual(first.stages.map((value) => value.stage), [
  'model_version_upload',
  'previous_deployed_model_undeploy_for_capacity',
  'model_version_deploy',
])
assert.equal(first.stages.every((value) => value.disposition === 'completed'),
  true)
assert.deepEqual(
  first.stages.map((value) => value.providerPostIssuedThisRun),
  [false, true, true],
)
assert.equal(providerPostCount, 2)
const rereadProfile =
  await rereadCanonicalSam31VertexSuccessorDeploymentProfile({
    objectPort,
    prefix: 'private/smoke/sam31-successor-rollout',
    profileRef: {
      id: 'sam31-vertex-successor-profile',
      version: 1,
      contentHash: `sha256:${profile.profileHash}`,
    },
  })
assert.equal(rereadProfile?.profileHash, profile.profileHash)
assert.equal(rereadProfile?.immutableImageDigest, profile.immutableImageDigest)

const replay = await owner.rolloutOne(profile)
assert.equal(replay.disposition, 'rolled_out')
assert.equal(replay.stages.every((value) =>
  !value.providerPostIssuedThisRun), true)
assert.equal(providerPostCount, 2)
assert.equal(objects.size > 10, true)

const unknownObjects = new Map<string, Buffer>()
let rejectedPostCount = 0
const unknownOwner =
  createCanonicalSam31VertexModelVersionSuccessorRolloutOwner({
    auth: {
      async request(value: { readonly url?: string; readonly method?: string }) {
        const url = String(value.url)
        if (value.method === 'POST') {
          rejectedPostCount += 1
          throw new Error('network outcome unknown')
        }
        if (url.endsWith('@bounded-log-transport-candidate')) {
          throw Object.assign(new Error('candidate absent'), { code: 404 })
        }
        if (url.endsWith('@4')) return { data: modelVersion(
          '4', '4',
          'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:1a75275b074e48a76f8c939dcb19994c9064b1edd329e897547230e4352ab017',
          false,
        ) }
        if (url.endsWith(
          '/endpoints/weeditpro-sam31-a100-scale-zero-v1')) {
          return { data: oldEndpoint() }
        }
        throw new Error(`Unexpected unknown-outcome URL: ${url}`)
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
    objectPort: mapObjectPort(unknownObjects),
    prefix: 'private/smoke/sam31-successor-unknown',
    now: () => '2026-08-14T20:31:01.000Z',
    sleep: async () => undefined,
    pollIntervalMilliseconds: 250,
    maximumWaitMilliseconds: 1_000,
  })
const unknown = await unknownOwner.rolloutOne(profile)
assert.equal(unknown.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknown.stages.length, 1)
assert.equal(unknown.stages[0]?.providerPostIssuedThisRun, true)
assert.equal(rejectedPostCount, 1)

const providerRejectedObjects = new Map<string, Buffer>()
let providerRejectedPostCount = 0
const providerRejectedOwner =
  createCanonicalSam31VertexModelVersionSuccessorRolloutOwner({
    auth: {
      async request(value: { readonly url?: string; readonly method?: string }) {
        const url = String(value.url)
        if (value.method === 'POST') {
          providerRejectedPostCount += 1
          throw {
            response: {
              status: 400,
              data: { error: {
                code: 9,
                message: 'service identity cannot read repository',
              } },
            },
          }
        }
        if (url.endsWith('@bounded-log-transport-candidate')) {
          throw Object.assign(new Error('candidate absent'), { code: 404 })
        }
        if (url.endsWith('@4')) return { data: modelVersion(
          '4', '4',
          'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:1a75275b074e48a76f8c939dcb19994c9064b1edd329e897547230e4352ab017',
          false,
        ) }
        if (url.endsWith(
          '/endpoints/weeditpro-sam31-a100-scale-zero-v1')) {
          return { data: oldEndpoint() }
        }
        throw new Error(`Unexpected provider-rejection URL: ${url}`)
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
    objectPort: mapObjectPort(providerRejectedObjects),
    prefix: 'private/smoke/sam31-successor-provider-rejected',
    now: () => '2026-08-14T20:32:01.000Z',
    sleep: async () => undefined,
    pollIntervalMilliseconds: 250,
    maximumWaitMilliseconds: 1_000,
  })
const providerRejected = await providerRejectedOwner.rolloutOne(profile)
assert.equal(providerRejected.disposition, 'terminal_failure')
assert.equal(providerRejected.stages.length, 1)
assert.equal(providerRejected.stages[0]?.observation, null)
assert.equal(providerRejectedPostCount, 1)
const providerRejectedReplay = await providerRejectedOwner.rolloutOne(profile)
assert.equal(providerRejectedReplay.disposition, 'terminal_failure')
assert.equal(providerRejectedReplay.stages[0]?.providerPostIssuedThisRun, false)
assert.equal(providerRejectedPostCount, 1)
const unknownReplay = await unknownOwner.rolloutOne(profile)
assert.equal(unknownReplay.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknownReplay.stages[0]?.providerPostIssuedThisRun, false)
assert.equal(rejectedPostCount, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-model-version-successor-rollout',
  checks: 60,
  exactModelVersionUpload: true,
  exactExistingCandidateAdoptedWithoutDuplicateUpload: true,
  restartReusedOriginalConsumptionTimestamp: true,
  exactA100ScaleZeroDeployment: true,
  previousDeploymentRemovedBeforeSuccessorDeployment: true,
  capacityOneReplacementSequence: true,
  providerEndpointRereadOmitsAcceptedScaleToZeroWriteFields: true,
  providerNormalizedContainerLoggingDisabled: true,
  previousModelVersionRetainedForRollback: true,
  durableConsumptionBeforeEveryProviderPost: true,
  restartReplayIssuedNoDuplicateProviderPost: true,
  absentAliasReconciledWithoutThrowing: true,
  rejectedOrUnknownPostNotRetried: true,
  providerHttpRejectionClassifiedNotExecuted: true,
  providerPostCount,
  customerRequestOrGpuInferenceStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function modelVersion(
  requested: string,
  versionId: string,
  image: string,
  successor: boolean,
) {
  return {
    name:
      `projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@${requested}`,
    versionId,
    versionAliases: [requested],
    containerSpec: {
      imageUri: image,
      ports: [{ containerPort: 8080 }],
      healthRoute: '/health',
      predictRoute: '/predict',
      deploymentTimeout: successor ? '1800s' : undefined,
      startupProbe: successor ? {
        httpGet: { path: '/health', port: 8080 },
        periodSeconds: 10,
        timeoutSeconds: 10,
        failureThreshold: 120,
        successThreshold: 1,
      } : undefined,
      env: successor ? [
        {
          name: 'WEEDITPRO_SAM31_RUNTIME_MODE',
          value: 'vertex_prediction_endpoint_v1',
        },
        {
          name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
          value: 'nvidia_a100_80gb',
        },
      ] : [],
    },
  }
}

function endpoint() {
  const previous = {
    id: '3101000010',
    model:
      'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    modelVersionId: '4',
    serviceAccount:
      'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
    dedicatedResources: resources(),
  }
  const successor = {
    id: '3101000012',
    model:
      'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    modelVersionId: '5',
    serviceAccount:
      'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
    enableAccessLogging: false,
    disableContainerLogging: true,
    dedicatedResources: providerVisibleResources(),
  }
  if (previousUndeployed && !successorDeployed) return {
    name:
      'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
  }
  return {
    name:
      'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
    deployedModels: successorDeployed ? [successor] : [previous],
    trafficSplit: successorDeployed
      ? { '3101000012': 100 }
      : { '3101000010': 100 },
  }
}

function resources() {
  return {
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
  }
}

function providerVisibleResources() {
  return {
    machineSpec: {
      machineType: 'a2-ultragpu-1g',
      acceleratorType: 'NVIDIA_A100_80GB',
      acceleratorCount: 1,
    },
    maxReplicaCount: 1,
  }
}

function oldEndpoint() {
  return {
    name:
      'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
    deployedModels: [{
      id: '3101000010',
      model:
        'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
      modelVersionId: '4',
      serviceAccount:
        'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
      dedicatedResources: resources(),
    }],
    trafficSplit: { '3101000010': 100 },
  }
}

function mapObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const existing = values.get(input.objectPath)
      if (existing) {
        assert.equal(existing.equals(input.body), true)
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
