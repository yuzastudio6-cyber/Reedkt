import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31VertexDedicatedPredictionRouteSchema,
} from '../services/canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  canonicalSam31VertexModelVersionRolloutSchema,
} from '../services/canonical-sam3_1-vertex-model-version-rollout-service'
import {
  canonicalSam31VertexServingReadinessProbeSchema,
} from '../services/canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  assertCanonicalSam31VertexServingQualificationCandidate,
  createCanonicalSam31VertexServingQualificationCandidateRepository,
  createCanonicalSam31VertexServingQualificationCandidateService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const observedAt = '2026-08-12T14:00:00.000Z'
const imageDigest =
  'sha256:1a75275b074e48a76f8c939dcb19994c9064b1edd329e897547230e4352ab017'
const imageSupplyChainReleaseRef = {
  id: 'sam31-production-image-supply-chain-release-a08f2b4a2afdcbfeb6030245',
  version: 1 as const,
  contentHash:
    'sha256:58c2fa6b6b6e4d5b3a361ead8cfa241daeef140a4b4a4c10e924e50b7d57733e' as const,
}
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef,
  immutableImageRef: {
    id: 'sam31-image-ae6a4c2109b7410317c68c45',
    version: 1,
    contentHash: imageDigest,
  },
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${imageDigest}`,
  immutableImageDigest: imageDigest,
  sourceCheckpointQualificationRef: {
    ...ref('source-checkpoint-qualification'),
    version: 2,
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
  },
  servingQuotaPreferenceRef: ref('serving-quota'),
  accountEffectiveRateAuthorityRef: ref('serving-rate'),
  recordedAt: '2026-08-12T13:30:00.000Z',
})
const deploymentProfileRef = ref('deployment-profile', profile.profileHash)
const rolloutPayload = {
  schemaVersion: 'canonical-sam3_1-vertex-model-version-rollout-v1' as const,
  source:
    'canonical_server_sam3_1_vertex_model_version_rollout_owner' as const,
  rolloutId:
    'sam31-vertex-model-version-rollout-5a1a8b4ecf22a0b7c7aca8aef530d680',
  imageSupplyChainReleaseRef,
  immutableImageUri: profile.immutableImageUri,
  immutableImageDigest: imageDigest,
  deployOperationName:
    'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1/operations/7274122883574530048' as const,
  deployOperationDone: true as const,
  modelResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const,
  modelVersionResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1@4' as const,
  modelVersionId: '4' as const,
  modelVersionAlias: 'bounded-memory-quality-candidate' as const,
  endpointResourceName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const,
  deployedModelId: '3101000010' as const,
  previousModelVersionId: '3' as const,
  previousDeployedModelId: '3101000006' as const,
  previousModelVersionRetainedForRollback: true as const,
  previousDeployedModelRemovedFromTraffic: true as const,
  exactModelVersionReread: true as const,
  exactDeployOperationReread: true as const,
  exactEndpointAndTrafficReread: true as const,
  routeId: 'a100_80gb_heavy_primary' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  acceleratorCount: 1 as const,
  minimumReplicaCount: 0 as const,
  initialReplicaCount: 1 as const,
  maximumReplicaCount: 1 as const,
  minimumScaleUpPeriodSeconds: 300 as const,
  idleScaleDownPeriodSeconds: 300 as const,
  trafficPercentage: 100 as const,
  onlyCurrentModelVersionReceivesTraffic: true as const,
  serviceAccount:
    'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com' as const,
  accessLoggingEnabled: false as const,
  containerLoggingEnabled: false as const,
  modelInferenceExecuted: false as const,
  customerInvocationStarted: false as const,
  customerCreditsMutated: false as const,
  runtimeQualified: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt: '2026-08-12T13:50:00.000Z',
}
const rollout = canonicalSam31VertexModelVersionRolloutSchema.parse({
  ...rolloutPayload,
  rolloutHash: sha256AuthorityValue(rolloutPayload),
})
const rolloutRef = ref(rollout.rolloutId, rollout.rolloutHash)
const routePayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-dedicated-prediction-route-v2' as const,
  source: 'canonical_server_vertex_dedicated_prediction_route_reader' as const,
  endpointResourceName: rollout.endpointResourceName,
  deployedModelId: rollout.deployedModelId,
  dedicatedEndpointDns:
    'weeditpro-sam31-a100-scale-zero-v1.us-central1-390722338345.prediction.vertexai.goog',
  predictUrl:
    'https://weeditpro-sam31-a100-scale-zero-v1.us-central1-390722338345.prediction.vertexai.goog/v1/projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1:predict',
  dedicatedEndpointEnabled: true as const,
  oneExactDeployedModel: true as const,
  exactTrafficSplitPercent: 100 as const,
  callerPredictionUrlAccepted: false as const,
}
const route = canonicalSam31VertexDedicatedPredictionRouteSchema.parse({
  ...routePayload,
  routeHash: sha256AuthorityValue(routePayload),
})
const probePayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-readiness-probe-v3' as const,
  source:
    'canonical_server_sam3_1_vertex_scale_zero_readiness_owner' as const,
  readinessProbeId: 'readiness-probe',
  readinessTriggerRef: ref('readiness-trigger'),
  endpointDeploymentRef: rolloutRef,
  imageSupplyChainReleaseRef,
  immutableImageDigest: imageDigest,
  endpointResourceName: rollout.endpointResourceName,
  deployedModelId: rollout.deployedModelId,
  modelVersionId: rollout.modelVersionId,
  requestBodyDigestSha256: sha256AuthorityValue('readiness-body'),
  predictUrlDigestSha256: sha256AuthorityValue('dedicated-predict-url'),
  disposition: 'ready_for_private_qualification_invocation' as const,
  safeDropped429ResponseCount: 1,
  totalProbeRequestCount: 2,
  serverVersion: 'canonical-sam3_1-vertex-prediction-server-v1' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  nvidiaDeviceNodesPresent: true as const,
  checkpointByteLength: 3_502_755_717 as const,
  checkpointSha256:
    '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6' as const,
  exactCheckpointBytesRereadAndHashed: true as const,
  privateCheckpointDownloadPerformedAtReplicaStartup: true,
  exactNonCustomerReadinessResponseAccepted: true as const,
  first429ClassifiedDroppedBeforeInferenceOnly: true as const,
  customerInvocationStarted: false as const,
  modelInferenceExecuted: false as const,
  storageReadPerformedAtReplicaStartup: true,
  storageWritePerformed: false as const,
  readinessRetryUsedCustomerSpendAuthority: false as const,
  walletOrCreditMutationAuthorityGranted: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  startedAt: '2026-08-12T13:55:00.000Z',
  readyObservedAt: observedAt,
}
const probe = canonicalSam31VertexServingReadinessProbeSchema.parse({
  ...probePayload,
  probeHash: sha256AuthorityValue(probePayload),
})
const repository =
  createCanonicalSam31VertexServingQualificationCandidateRepository({
    objectPort: memoryObjectPort(),
    prefix: 'private/test/sam31-serving-candidates',
  })
const service = createCanonicalSam31VertexServingQualificationCandidateService({
  currentRouteReadPort: {
    async rereadCurrentRoute() { return structuredClone(route) },
  },
  repository,
})
const request = {
  profile,
  deploymentProfileRef,
  modelVersionRolloutRef: rolloutRef,
  modelVersionRollout: rollout,
  endpointDeploymentRef: rolloutRef,
  readinessProbeRef: ref('readiness-probe-ref', probe.probeHash),
  readinessProbe: probe,
  observedAt,
  expiresAt: '2026-08-12T14:10:00.000Z',
}
const candidate = await service.produceOne(request)
assert.equal(candidate.readyForPrivateQualificationInvocation, true)
assert.equal(candidate.readyForCustomerInvocation, false)
assert.equal(candidate.runtimeReleaseGranted, false)
assert.equal(candidate.customerInvocationStarted, false)
assert.equal(candidate.deployedModelId, '3101000010')
assert.equal(candidate.modelVersionId, '4')
assert.deepEqual(
  assertCanonicalSam31VertexServingQualificationCandidate(
    candidate,
    observedAt,
  ),
  candidate,
)
assert.equal((await service.produceOne(request)).candidateHash,
  candidate.candidateHash)
await assert.rejects(() => service.produceOne({
  ...request,
  endpointDeploymentRef: ref('wrong-endpoint'),
}))
await assert.rejects(() => service.produceOne({
  ...request,
  modelVersionRolloutRef: ref('wrong-rollout'),
}))
await assert.rejects(() => service.produceOne({
  ...request,
  modelVersionRollout: { ...rollout, rolloutHash: '0'.repeat(64) },
}))
assert.throws(() => assertCanonicalSam31VertexServingQualificationCandidate({
  ...candidate,
  readyForCustomerInvocation: true,
}))
assert.throws(() => assertCanonicalSam31VertexServingQualificationCandidate(
  candidate,
  candidate.expiresAt,
))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-qualification-candidate',
  status: 'passed',
  checks: 16,
  candidateId: candidate.candidateId,
  modelVersionId: candidate.modelVersionId,
  deployedModelId: candidate.deployedModelId,
  readyForPrivateQualificationInvocation:
    candidate.readyForPrivateQualificationInvocation,
  readyForCustomerInvocation: candidate.readyForCustomerInvocation,
  runtimeReleaseGranted: candidate.runtimeReleaseGranted,
  customerCreditsMutated: candidate.customerCreditsMutated,
  productionAuthorityGranted: candidate.productionAuthorityGranted,
}, null, 2))

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const values = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      if (values.has(input.objectPath)) return 'already_exists'
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function ref(id: string, digest = sha256AuthorityValue(id)) {
  return { id, version: 1 as const, contentHash: `sha256:${digest}` as const }
}
