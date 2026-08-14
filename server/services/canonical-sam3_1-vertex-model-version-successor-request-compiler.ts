import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_SUCCESSOR_REQUEST_VERSION =
  'canonical-sam3_1-vertex-model-version-successor-request-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const PARENT = 'projects/reeditpro/locations/us-central1' as const
const MODEL_RESOURCE =
  `${PARENT}/models/weeditpro-sam31-a100-scale-zero-v1` as const
const ENDPOINT_RESOURCE =
  `${PARENT}/endpoints/weeditpro-sam31-a100-scale-zero-v1` as const
const CANDIDATE_ALIAS = 'cold-start-health-fix-candidate' as const
const DEPLOYED_MODEL_ID = '3101000005' as const
const SERVICE_ACCOUNT =
  'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com' as const

const safeUrl = z.string().url().refine((value) => {
  const url = new URL(value)
  return url.origin === API_ORIGIN
    && url.username === ''
    && url.password === ''
    && url.hash === ''
})
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const modelVersionResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/models\/weeditpro-sam31-a100-scale-zero-v1@[1-9][0-9]*$/u,
)
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_SUCCESSOR_REQUEST_VERSION,
  ),
  source: z.literal(
    'canonical_backend_sam3_1_vertex_model_version_successor_request_compiler',
  ),
  stage: z.enum(['model_version_upload', 'model_version_deploy']),
  method: z.literal('POST'),
  url: safeUrl,
  contentType: z.literal('application/json'),
  profileHash: sha256,
  body: z.record(z.string(), z.unknown()),
  existingModelAndEndpointRereadRequired: z.literal(true),
  previousModelVersionRetainedForRollback: z.literal(true),
  previousDeployedModelReceivesTraffic: z.literal(false),
  callerUrlImageModelAliasDeployedIdMachineGpuScalePriceOrServiceAccountAccepted:
    z.literal(false),
  requestResponsePayloadLoggingEnabled: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()

export type CanonicalSam31VertexModelVersionSuccessorRequest = z.infer<
  typeof requestSchema
>

export function createCanonicalSam31VertexModelVersionSuccessorUploadRequest(
  value: CanonicalSam31VertexScaleZeroDeploymentProfile,
): CanonicalSam31VertexModelVersionSuccessorRequest {
  const profile = acceptProfile(value)
  return createRequest({
    stage: 'model_version_upload',
    url: `${API_ORIGIN}/v1beta1/${PARENT}/models:upload`,
    profileHash: profile.profileHash,
    body: {
      parentModel: MODEL_RESOURCE,
      model: {
        displayName: profile.endpoint.displayName,
        description:
          'WeEditPro private SAM 3.1 A100 80GB cold-start health successor.',
        labels: {
          'weeditpro-component': 'sam31',
          'weeditpro-route': 'a100-heavy-primary',
          'weeditpro-release': 'cold-start-health-fix',
        },
        versionAliases: [CANDIDATE_ALIAS],
        versionDescription:
          'Source-bound successor with early HTTP liveness and fail-closed checkpoint readiness.',
        containerSpec: containerSpec(profile),
      },
      serviceAccount: SERVICE_ACCOUNT,
    },
  })
}

export function createCanonicalSam31VertexModelVersionSuccessorDeployRequest(
  input: {
    readonly profile: CanonicalSam31VertexScaleZeroDeploymentProfile
    readonly modelVersionResourceName: string
  },
): CanonicalSam31VertexModelVersionSuccessorRequest {
  const profile = acceptProfile(input.profile)
  const model = modelVersionResource.parse(input.modelVersionResourceName)
  return createRequest({
    stage: 'model_version_deploy',
    url: `${API_ORIGIN}/v1beta1/${ENDPOINT_RESOURCE}:deployModel`,
    profileHash: profile.profileHash,
    body: {
      deployedModel: {
        id: DEPLOYED_MODEL_ID,
        model,
        displayName: profile.endpoint.displayName,
        serviceAccount: SERVICE_ACCOUNT,
        enableAccessLogging: false,
        disableContainerLogging: false,
        dedicatedResources: {
          machineSpec: {
            machineType: profile.dedicatedResources.machineType,
            acceleratorType: 'NVIDIA_A100_80GB',
            acceleratorCount: profile.dedicatedResources.acceleratorCount,
          },
          minReplicaCount: profile.dedicatedResources.minimumReplicaCount,
          initialReplicaCount:
            profile.dedicatedResources.initialReplicaCount,
          maxReplicaCount: profile.dedicatedResources.maximumReplicaCount,
          scaleToZeroSpec: profile.dedicatedResources.scaleToZeroSpec,
          spot: false,
        },
      },
      trafficSplit: { '0': 100 },
    },
  })
}

export function assertCanonicalSam31VertexModelVersionSuccessorRequest(
  value: unknown,
): CanonicalSam31VertexModelVersionSuccessorRequest {
  const parsed = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = parsed
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 Vertex successor request digest changed.')
  }
  return parsed
}

function acceptProfile(
  value: CanonicalSam31VertexScaleZeroDeploymentProfile,
): CanonicalSam31VertexScaleZeroDeploymentProfile {
  const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(value)
  if (
    profile.endpoint.controlPlaneApiVersion !== 'v1beta1'
    || profile.endpoint.projectId !== 'reeditpro'
    || profile.endpoint.region !== 'us-central1'
    || profile.endpoint.endpointId !==
      'weeditpro-sam31-a100-scale-zero-v1'
    || profile.dedicatedResources.machineType !== 'a2-ultragpu-1g'
    || profile.dedicatedResources.acceleratorType !== 'nvidia-a100-80gb'
    || profile.dedicatedResources.acceleratorCount !== 1
    || profile.dedicatedResources.minimumReplicaCount !== 0
    || profile.dedicatedResources.initialReplicaCount !== 1
    || profile.dedicatedResources.maximumReplicaCount !== 1
    || profile.dedicatedResources.scaleToZeroSpec.minScaleupPeriod !== '300s'
    || profile.dedicatedResources.scaleToZeroSpec.idleScaledownPeriod !== '300s'
    || profile.container.port !== 8080
    || profile.container.healthRoute !== '/health'
    || profile.container.predictRoute !== '/predict'
    || profile.container.runtimeMode !== 'vertex_prediction_endpoint_v1'
    || profile.container.acceleratorClass !== 'nvidia_a100_80gb'
    || profile.serviceIdentity.email !== SERVICE_ACCOUNT
  ) throw new Error('SAM 3.1 Vertex successor deployment profile changed.')
  return profile
}

function containerSpec(
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
) {
  return {
    imageUri: profile.immutableImageUri,
    ports: [{ containerPort: profile.container.port }],
    healthRoute: profile.container.healthRoute,
    predictRoute: profile.container.predictRoute,
    deploymentTimeout: '1800s',
    startupProbe: {
      httpGet: {
        path: profile.container.healthRoute,
        port: profile.container.port,
      },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 10,
      failureThreshold: 120,
      successThreshold: 1,
    },
    env: [
      {
        name: 'WEEDITPRO_SAM31_RUNTIME_MODE',
        value: profile.container.runtimeMode,
      },
      {
        name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
        value: profile.container.acceleratorClass,
      },
    ],
  }
}

function createRequest(input: {
  readonly stage: 'model_version_upload' | 'model_version_deploy'
  readonly url: string
  readonly profileHash: string
  readonly body: Record<string, unknown>
}): CanonicalSam31VertexModelVersionSuccessorRequest {
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_SUCCESSOR_REQUEST_VERSION,
    source:
      'canonical_backend_sam3_1_vertex_model_version_successor_request_compiler',
    stage: input.stage,
    method: 'POST',
    url: input.url,
    contentType: 'application/json',
    profileHash: input.profileHash,
    body: input.body,
    existingModelAndEndpointRereadRequired: true,
    previousModelVersionRetainedForRollback: true,
    previousDeployedModelReceivesTraffic: false,
    callerUrlImageModelAliasDeployedIdMachineGpuScalePriceOrServiceAccountAccepted:
      false,
    requestResponsePayloadLoggingEnabled: false,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  })
}
