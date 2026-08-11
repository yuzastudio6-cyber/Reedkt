import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_REQUEST_VERSION =
  'canonical-sam3_1-vertex-scale-zero-deployment-request-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const PARENT = 'projects/reeditpro/locations/us-central1' as const
const MODEL_ID = 'weeditpro-sam31-a100-scale-zero-v1' as const
const ENDPOINT_ID = 'weeditpro-sam31-a100-scale-zero-v1' as const
const MODEL_RESOURCE = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/models\/[a-z0-9_-]{1,63}$/u,
)
const safeUrl = z.string().url().refine((value) => {
  const url = new URL(value)
  return url.origin === API_ORIGIN
    && url.username === ''
    && url.password === ''
    && url.hash === ''
})
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_REQUEST_VERSION,
  ),
  source: z.literal(
    'canonical_backend_sam3_1_vertex_scale_zero_request_compiler',
  ),
  stage: z.enum(['model_upload', 'endpoint_create', 'model_deploy']),
  method: z.literal('POST'),
  url: safeUrl,
  contentType: z.literal('application/json'),
  profileHash: sha256,
  body: z.record(z.string(), z.unknown()),
  callerUrlPathImageModelMachineGpuScalePriceOrServiceAccountAccepted:
    z.literal(false),
  requestResponsePayloadLoggingEnabled: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
export type CanonicalSam31VertexScaleZeroDeploymentRequest = z.infer<
  typeof requestSchema
>

export function createCanonicalSam31VertexScaleZeroFoundationRequests(
  value: CanonicalSam31VertexScaleZeroDeploymentProfile,
): readonly [
  CanonicalSam31VertexScaleZeroDeploymentRequest,
  CanonicalSam31VertexScaleZeroDeploymentRequest,
] {
  const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(value)
  assertV1Beta1ScaleToZeroProfile(profile)
  return Object.freeze([
    request('model_upload', `${API_ORIGIN}/v1beta1/${PARENT}/models:upload`, {
      modelId: MODEL_ID,
      model: {
        displayName: profile.endpoint.displayName,
        description:
          'WeEditPro private SAM 3.1 A100 80GB scale-zero serving model.',
        labels: {
          'weeditpro-component': 'sam31',
          'weeditpro-route': 'a100-heavy-primary',
        },
        containerSpec: {
          imageUri: profile.immutableImageUri,
          ports: [{ containerPort: profile.container.port }],
          healthRoute: profile.container.healthRoute,
          predictRoute: profile.container.predictRoute,
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
        },
      },
    }, profile.profileHash),
    request('endpoint_create',
      `${API_ORIGIN}/v1beta1/${PARENT}/endpoints?endpointId=${ENDPOINT_ID}`, {
        displayName: profile.endpoint.displayName,
        description:
          'WeEditPro private one-model SAM 3.1 A100 scale-zero endpoint.',
        labels: {
          'weeditpro-component': 'sam31',
          'weeditpro-route': 'a100-heavy-primary',
        },
        dedicatedEndpointEnabled: true,
        predictRequestResponseLoggingConfig: {
          enabled: false,
        },
      }, profile.profileHash),
  ])
}

export function createCanonicalSam31VertexScaleZeroModelDeployRequest(input: {
  readonly profile: CanonicalSam31VertexScaleZeroDeploymentProfile
  readonly modelResourceName: string
}): CanonicalSam31VertexScaleZeroDeploymentRequest {
  const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
    input.profile,
  )
  assertV1Beta1ScaleToZeroProfile(profile)
  const model = MODEL_RESOURCE.parse(input.modelResourceName)
  return request('model_deploy',
    `${API_ORIGIN}/v1beta1/${PARENT}/endpoints/${ENDPOINT_ID}:deployModel`, {
      deployedModel: {
        model,
        displayName: profile.endpoint.displayName,
        serviceAccount: profile.serviceIdentity.email,
        enableAccessLogging: false,
        disableContainerLogging: true,
        dedicatedResources: {
          machineSpec: {
            machineType: profile.dedicatedResources.machineType,
            acceleratorType: 'NVIDIA_A100_80GB',
            acceleratorCount: profile.dedicatedResources.acceleratorCount,
          },
          minReplicaCount:
            profile.dedicatedResources.minimumReplicaCount,
          initialReplicaCount:
            profile.dedicatedResources.initialReplicaCount,
          maxReplicaCount:
            profile.dedicatedResources.maximumReplicaCount,
          scaleToZeroSpec: profile.dedicatedResources.scaleToZeroSpec,
          spot: false,
        },
      },
      trafficSplit: { '0': 100 },
    }, profile.profileHash)
}

export function assertCanonicalSam31VertexScaleZeroDeploymentRequest(
  value: unknown,
): CanonicalSam31VertexScaleZeroDeploymentRequest {
  const parsed = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = parsed
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 Vertex deployment request digest changed.')
  }
  return parsed
}

function request(
  stage: 'model_upload' | 'endpoint_create' | 'model_deploy',
  url: string,
  body: Record<string, unknown>,
  profileHash: string,
): CanonicalSam31VertexScaleZeroDeploymentRequest {
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_REQUEST_VERSION,
    source: 'canonical_backend_sam3_1_vertex_scale_zero_request_compiler',
    stage,
    method: 'POST',
    url,
    contentType: 'application/json',
    profileHash,
    body,
    callerUrlPathImageModelMachineGpuScalePriceOrServiceAccountAccepted:
      false,
    requestResponsePayloadLoggingEnabled: false,
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

function assertV1Beta1ScaleToZeroProfile(
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
): void {
  if (
    profile.endpoint.controlPlaneApiVersion !== 'v1beta1'
    || profile.dedicatedResources.minimumReplicaCount !== 0
    || profile.dedicatedResources.initialReplicaCount < 1
    || profile.dedicatedResources.initialReplicaCount >
      profile.dedicatedResources.maximumReplicaCount
    || profile.dedicatedResources.scaleToZeroSpec.minScaleupPeriod !== '300s'
    || profile.dedicatedResources.scaleToZeroSpec.idleScaledownPeriod !== '300s'
  ) throw new Error('SAM 3.1 Vertex scale-zero API profile changed.')
}
