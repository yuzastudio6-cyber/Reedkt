import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31VertexScaleZeroControlPlaneObservation,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane'
import {
  createCanonicalSam31VertexScaleZeroModelDeployRequest,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31VertexServingExactDeploymentSchema,
} from '../services/canonical-sam3_1-vertex-serving-deployment-ready-service'
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

const observedAt = '2026-08-12T07:00:00.000Z'
const imageDigest = hash('serving-image')
const imageSupplyChainReleaseRef = ref('image-supply-chain-release')
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef,
  immutableImageRef: ref('immutable-image', imageDigest.slice(7)),
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
  recordedAt: '2026-08-12T06:30:00.000Z',
})
const deploymentProfileRef = ref('deployment-profile', profile.profileHash)
const modelUploadObservationRef = ref('model-upload')
const endpointCreateObservationRef = ref('endpoint-create')
const modelDeployRequest = createCanonicalSam31VertexScaleZeroModelDeployRequest({
  profile,
  modelResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
})
const modelDeployRequestRef = ref(
  `sam31-vertex-model_deploy-request-${
    modelDeployRequest.requestDigestSha256.slice(0, 32)}`,
  modelDeployRequest.requestDigestSha256,
)
const deployObservationPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-scale-zero-control-plane-observation-v1' as const,
  source:
    'canonical_backend_sam3_1_vertex_scale_zero_control_plane' as const,
  stage: 'model_deploy' as const,
  requestDigestSha256: modelDeployRequest.requestDigestSha256,
  submissionHash: sha256AuthorityValue('model-deploy-submission'),
  operationName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1/operations/model-deploy-operation',
  disposition: 'completed' as const,
  operationDone: true,
  modelResourceName: null,
  endpointResourceName: null,
  deployedModelId: '3101000001',
  providerErrorRef: null,
  observationMode: 'exact_operation_reread' as const,
  exactOperationReread: true,
  exactResourceReread: false,
  automaticRetryAllowed: false as const,
  customerRequestOrGpuInferenceStarted: false as const,
  walletOrCreditMutationAuthorityGranted: false as const,
  publicDeliveryAuthorityGranted: false as const,
  productionAuthorityGranted: false as const,
  observedAt,
}
const modelDeployObservation =
  assertCanonicalSam31VertexScaleZeroControlPlaneObservation({
    ...deployObservationPayload,
    observationHash: sha256AuthorityValue(deployObservationPayload),
  })
const modelDeployObservationRef = ref(
  'model-deploy',
  modelDeployObservation.observationHash,
)
const endpointDeploymentRef = ref('endpoint-deployment')

const exactPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-exact-deployment-v2' as const,
  source: 'canonical_server_vertex_exact_deployment_resource_reader' as const,
  deploymentProfileRef,
  modelUploadObservationRef,
  endpointCreateObservationRef,
  modelDeployObservationRef,
  imageSupplyChainReleaseRef,
  immutableImageUri: profile.immutableImageUri,
  immutableImageDigest: imageDigest,
  modelResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const,
  endpointResourceName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const,
  deployedModelId: '3101000001' as const,
  serviceAccount:
    'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  acceleratorCount: 1 as const,
  minimumReplicaCount: 0 as const,
  initialReplicaCount: 1 as const,
  maximumReplicaCount: 1 as const,
  minScaleupPeriod: '300s' as const,
  idleScaledownPeriod: '300s' as const,
  dedicatedEndpointEnabled: true as const,
  oneExactDeployedModel: true as const,
  exactTrafficSplitPercent: 100 as const,
  requestResponseLoggingEnabled: false as const,
  containerLoggingEnabled: false as const,
  exactModelEndpointDeploymentAndTrafficReread: true as const,
  customerInvocationStarted: false as const,
  walletOrCreditMutationAuthorityGranted: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt,
}
const exact = canonicalSam31VertexServingExactDeploymentSchema.parse({
  ...exactPayload,
  observationHash: sha256AuthorityValue(exactPayload),
})
const probePayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-readiness-probe-v2' as const,
  source:
    'canonical_server_sam3_1_vertex_scale_zero_readiness_owner' as const,
  readinessProbeId: 'readiness-probe',
  readinessTriggerRef: ref('readiness-trigger'),
  endpointDeploymentRef,
  imageSupplyChainReleaseRef,
  immutableImageDigest: imageDigest,
  endpointResourceName: exact.endpointResourceName,
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
  startedAt: '2026-08-12T06:55:00.000Z',
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
const service =
  createCanonicalSam31VertexServingQualificationCandidateService({
    exactDeploymentReadPort: {
      async rereadExactDeployment() { return structuredClone(exact) },
    },
    repository,
  })
const request = {
  profile,
  deploymentProfileRef,
  modelUploadObservationRef,
  endpointCreateObservationRef,
  modelDeployObservationRef,
  modelDeployRequestRef,
  modelDeployRequest,
  modelDeployObservation,
  endpointDeploymentRef,
  readinessProbeRef: ref('readiness-probe-ref', probe.probeHash),
  readinessProbe: probe,
  observedAt,
  expiresAt: '2026-08-12T07:10:00.000Z',
}
const candidate = await service.produceOne(request)
assert.equal(candidate.readyForPrivateQualificationInvocation, true)
assert.equal(candidate.readyForCustomerInvocation, false)
assert.equal(candidate.runtimeReleaseGranted, false)
assert.equal(candidate.customerInvocationStarted, false)
assert.equal(candidate.executionTarget,
  'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra')
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
  modelDeployRequestRef: ref('wrong-model-deploy-request'),
}))
await assert.rejects(() => service.produceOne({
  ...request,
  modelDeployObservation: {
    ...modelDeployObservation,
    observationHash: '0'.repeat(64),
  },
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
  checks: 14,
  candidateId: candidate.candidateId,
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
