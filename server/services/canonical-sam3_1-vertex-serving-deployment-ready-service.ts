import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  canonicalSam31VertexServingDeploymentReadySchema,
  type CanonicalSam31VertexServingDeploymentReady,
} from './canonical-sam3_1-vertex-serving-invocation-service'
import {
  assertCanonicalSam31VertexServingReadinessProbe,
} from './canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SERVING_EXACT_DEPLOYMENT_VERSION =
  'canonical-sam3_1-vertex-serving-exact-deployment-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com'
const MODEL_RESOURCE =
  'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const
const ENDPOINT_RESOURCE =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const DEPLOYED_MODEL_ID = '3101000001' as const
const SERVING_ACCOUNT =
  'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

const exactWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_EXACT_DEPLOYMENT_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_exact_deployment_resource_reader',
  ),
  deploymentProfileRef: refSchema,
  modelUploadObservationRef: refSchema,
  endpointCreateObservationRef: refSchema,
  modelDeployObservationRef: refSchema,
  runtimeReleaseRef: refSchema,
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
  ),
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  modelResourceName: z.literal(MODEL_RESOURCE),
  endpointResourceName: z.literal(ENDPOINT_RESOURCE),
  deployedModelId: z.literal(DEPLOYED_MODEL_ID),
  serviceAccount: z.literal(SERVING_ACCOUNT),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCount: z.literal(1),
  minimumReplicaCount: z.literal(0),
  initialReplicaCount: z.literal(1),
  maximumReplicaCount: z.literal(1),
  minScaleupPeriod: z.literal('300s'),
  idleScaledownPeriod: z.literal('300s'),
  dedicatedEndpointEnabled: z.literal(true),
  oneExactDeployedModel: z.literal(true),
  exactTrafficSplitPercent: z.literal(100),
  requestResponseLoggingEnabled: z.literal(false),
  containerLoggingEnabled: z.literal(false),
  exactModelEndpointDeploymentAndTrafficReread: z.literal(true),
  customerInvocationStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (!value.immutableImageUri.endsWith(value.immutableImageDigest)) {
    context.addIssue({
      code: 'custom',
      message: 'Exact Vertex deployment image identity changed.',
    })
  }
})
export const canonicalSam31VertexServingExactDeploymentSchema =
  exactWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31VertexServingExactDeployment = z.infer<
  typeof canonicalSam31VertexServingExactDeploymentSchema
>

export interface CanonicalSam31VertexServingExactDeploymentReadPort {
  rereadExactDeployment(input: {
    readonly profile: CanonicalSam31VertexScaleZeroDeploymentProfile
    readonly deploymentProfileRef: Ref
    readonly modelUploadObservationRef: Ref
    readonly endpointCreateObservationRef: Ref
    readonly modelDeployObservationRef: Ref
    readonly at: string
  }): Promise<unknown>
}

export function createCanonicalSam31VertexServingDeploymentReadyService(
  input: {
    readonly exactDeploymentReadPort:
      CanonicalSam31VertexServingExactDeploymentReadPort
  },
) {
  return Object.freeze({
    async produceOne(untrusted: {
      readonly profile: unknown
      readonly deploymentProfileRef: Ref
      readonly modelUploadObservationRef: Ref
      readonly endpointCreateObservationRef: Ref
      readonly modelDeployObservationRef: Ref
      readonly readinessProbeRef: Ref
      readonly readinessProbe: unknown
      readonly observedAt: string
      readonly expiresAt: string
    }): Promise<CanonicalSam31VertexServingDeploymentReady> {
      assertPlainSerializedData(untrusted, 'sam31_vertex_deployment_ready')
      const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        untrusted.profile,
      )
      const references = z.object({
        deploymentProfileRef: refSchema,
        modelUploadObservationRef: refSchema,
        endpointCreateObservationRef: refSchema,
        modelDeployObservationRef: refSchema,
        readinessProbeRef: refSchema,
        observedAt: timestamp,
        expiresAt: timestamp,
      }).strict().parse({
        deploymentProfileRef: untrusted.deploymentProfileRef,
        modelUploadObservationRef: untrusted.modelUploadObservationRef,
        endpointCreateObservationRef: untrusted.endpointCreateObservationRef,
        modelDeployObservationRef: untrusted.modelDeployObservationRef,
        readinessProbeRef: untrusted.readinessProbeRef,
        observedAt: untrusted.observedAt,
        expiresAt: untrusted.expiresAt,
      })
      if (
        references.deploymentProfileRef.contentHash !==
          `sha256:${profile.profileHash}`
        || Date.parse(references.expiresAt) -
          Date.parse(references.observedAt) > 120_000
      ) throw new Error('Vertex deployment-ready scope changed.')
      const probe = assertCanonicalSam31VertexServingReadinessProbe(
        untrusted.readinessProbe,
      )
      if (
        references.readinessProbeRef.contentHash !==
          `sha256:${probe.probeHash}`
        || probe.runtimeReleaseRef.contentHash !==
          profile.runtimeReleaseRef.contentHash
        || probe.immutableImageDigest !== profile.immutableImageDigest
        || probe.readyObservedAt !== references.observedAt
      ) throw new Error('Vertex readiness probe crossed deployment scope.')
      const exact = assertCanonicalSam31VertexServingExactDeployment(
        await input.exactDeploymentReadPort.rereadExactDeployment({
          profile,
          ...references,
          at: references.observedAt,
        }),
      )
      assertExactLineage({ profile, references, exact })
      const exactDeploymentObservationRef = refSchema.parse({
        id: `sam31-a100-exact-deployment-${exact.observationHash.slice(0, 32)}`,
        version: 1,
        contentHash: `sha256:${exact.observationHash}`,
      })
      const endpointDeploymentRef = refSchema.parse({
        id: `weeditpro-sam31-a100-ready-${probe.probeHash.slice(0, 32)}`,
        version: 1,
        contentHash: `sha256:${sha256AuthorityValue({
          deploymentObservationHash: exact.observationHash,
          readinessProbeHash: probe.probeHash,
        })}`,
      })
      const payload = {
        schemaVersion:
          'canonical-sam3_1-vertex-serving-deployment-ready-v1' as const,
        source:
          'canonical_server_vertex_scale_zero_deployment_readiness_owner' as const,
        deploymentProfileRef: references.deploymentProfileRef,
        endpointDeploymentRef,
        exactDeploymentObservationRef,
        runtimeReleaseRef: profile.runtimeReleaseRef,
        readinessProbeRef: references.readinessProbeRef,
        modelUploadObservationRef: references.modelUploadObservationRef,
        endpointCreateObservationRef: references.endpointCreateObservationRef,
        modelDeployObservationRef: references.modelDeployObservationRef,
        endpointResourceName: ENDPOINT_RESOURCE,
        deployedModelId: DEPLOYED_MODEL_ID,
        immutableImageDigest: profile.immutableImageDigest,
        routeId: 'a100_80gb_heavy_primary' as const,
        machineType: 'a2-ultragpu-1g' as const,
        accelerator: 'nvidia_a100_80gb' as const,
        minimumReplicaCount: 0 as const,
        maximumReplicaCount: 1 as const,
        maximumConcurrentInvocations: 1 as const,
        exactModelEndpointDeploymentAndTrafficReread: true as const,
        exactNonCustomerGpuReadinessProbeReread: true as const,
        readyForPrivateInvocation: true as const,
        customerInvocationStarted: false as const,
        walletOrCreditMutationAuthorityGranted: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
        observedAt: references.observedAt,
        expiresAt: references.expiresAt,
      }
      return canonicalSam31VertexServingDeploymentReadySchema.parse({
        ...payload,
        readinessHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function createGoogleCloudSam31VertexServingExactDeploymentReadPort(
  input: {
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly timeoutMilliseconds?: number
  } = {},
): CanonicalSam31VertexServingExactDeploymentReadPort {
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('Exact Vertex deployment reread timeout changed.')
  }
  return Object.freeze({
    async rereadExactDeployment(request: {
      readonly profile: CanonicalSam31VertexScaleZeroDeploymentProfile
      readonly deploymentProfileRef: Ref
      readonly modelUploadObservationRef: Ref
      readonly endpointCreateObservationRef: Ref
      readonly modelDeployObservationRef: Ref
      readonly at: string
    }) {
      const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        request.profile,
      )
      const [modelResponse, endpointResponse] = await Promise.all([
        auth.request({
          url: `${API_ORIGIN}/v1beta1/${MODEL_RESOURCE}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        }),
        auth.request({
          url: `${API_ORIGIN}/v1beta1/${ENDPOINT_RESOURCE}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        }),
      ])
      const model = parseModel(modelResponse.data, profile)
      const endpoint = parseEndpoint(endpointResponse.data, profile)
      const payload = exactWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_VERTEX_SERVING_EXACT_DEPLOYMENT_VERSION,
        source: 'canonical_server_vertex_exact_deployment_resource_reader',
        deploymentProfileRef: request.deploymentProfileRef,
        modelUploadObservationRef: request.modelUploadObservationRef,
        endpointCreateObservationRef: request.endpointCreateObservationRef,
        modelDeployObservationRef: request.modelDeployObservationRef,
        runtimeReleaseRef: profile.runtimeReleaseRef,
        immutableImageUri: model.containerSpec.imageUri,
        immutableImageDigest: profile.immutableImageDigest,
        modelResourceName: model.name,
        endpointResourceName: endpoint.name,
        deployedModelId: endpoint.deployedModels[0]!.id,
        serviceAccount: endpoint.deployedModels[0]!.serviceAccount,
        machineType: endpoint.deployedModels[0]!.dedicatedResources
          .machineSpec.machineType,
        accelerator: 'nvidia_a100_80gb',
        acceleratorCount: endpoint.deployedModels[0]!.dedicatedResources
          .machineSpec.acceleratorCount,
        minimumReplicaCount: endpoint.deployedModels[0]!.dedicatedResources
          .minReplicaCount,
        initialReplicaCount: endpoint.deployedModels[0]!.dedicatedResources
          .initialReplicaCount,
        maximumReplicaCount: endpoint.deployedModels[0]!.dedicatedResources
          .maxReplicaCount,
        minScaleupPeriod: endpoint.deployedModels[0]!.dedicatedResources
          .scaleToZeroSpec.minScaleupPeriod,
        idleScaledownPeriod: endpoint.deployedModels[0]!.dedicatedResources
          .scaleToZeroSpec.idleScaledownPeriod,
        dedicatedEndpointEnabled: endpoint.dedicatedEndpointEnabled,
        oneExactDeployedModel: true,
        exactTrafficSplitPercent: endpoint.trafficSplit[DEPLOYED_MODEL_ID],
        requestResponseLoggingEnabled:
          endpoint.predictRequestResponseLoggingConfig.enabled,
        containerLoggingEnabled:
          !endpoint.deployedModels[0]!.disableContainerLogging,
        exactModelEndpointDeploymentAndTrafficReread: true,
        customerInvocationStarted: false,
        walletOrCreditMutationAuthorityGranted: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt: timestamp.parse(request.at),
      })
      return canonicalSam31VertexServingExactDeploymentSchema.parse({
        ...payload,
        observationHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertCanonicalSam31VertexServingExactDeployment(
  value: unknown,
): CanonicalSam31VertexServingExactDeployment {
  assertPlainSerializedData(value, 'sam31_vertex_exact_deployment')
  const parsed = canonicalSam31VertexServingExactDeploymentSchema.parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Exact Vertex deployment digest changed.')
  }
  return parsed
}

function parseModel(value: unknown,
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile) {
  return z.object({
    name: z.literal(MODEL_RESOURCE),
    displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    containerSpec: z.object({
      imageUri: z.literal(profile.immutableImageUri),
      ports: z.array(z.object({ containerPort: z.literal(8080) }).passthrough())
        .length(1),
      healthRoute: z.literal('/health'),
      predictRoute: z.literal('/predict'),
    }).passthrough(),
  }).passthrough().parse(value)
}

function parseEndpoint(value: unknown,
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile) {
  const parsed = z.object({
    name: z.literal(ENDPOINT_RESOURCE),
    displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    dedicatedEndpointEnabled: z.literal(true),
    predictRequestResponseLoggingConfig: z.object({
      enabled: z.literal(false),
    }).passthrough(),
    deployedModels: z.array(z.object({
      id: z.literal(DEPLOYED_MODEL_ID),
      model: z.literal(MODEL_RESOURCE),
      serviceAccount: z.literal(SERVING_ACCOUNT),
      disableContainerLogging: z.literal(true),
      dedicatedResources: z.object({
        machineSpec: z.object({
          machineType: z.literal(profile.dedicatedResources.machineType),
          acceleratorType: z.literal('NVIDIA_A100_80GB'),
          acceleratorCount: z.literal(1),
        }).passthrough(),
        minReplicaCount: z.literal(0),
        initialReplicaCount: z.literal(1),
        maxReplicaCount: z.literal(1),
        scaleToZeroSpec: z.object({
          minScaleupPeriod: z.literal('300s'),
          idleScaledownPeriod: z.literal('300s'),
        }).passthrough(),
      }).passthrough(),
    }).passthrough()).length(1),
    trafficSplit: z.record(z.string(), z.number().int().nonnegative().safe()),
  }).passthrough().parse(value)
  if (
    Object.keys(parsed.trafficSplit).length !== 1
    || parsed.trafficSplit[DEPLOYED_MODEL_ID] !== 100
  ) throw new Error('Exact Vertex endpoint traffic split changed.')
  return parsed
}

function assertExactLineage(input: {
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile
  references: { deploymentProfileRef: Ref; modelUploadObservationRef: Ref;
    endpointCreateObservationRef: Ref; modelDeployObservationRef: Ref }
  exact: CanonicalSam31VertexServingExactDeployment
}): void {
  if (
    input.exact.immutableImageDigest !== input.profile.immutableImageDigest
    || input.exact.runtimeReleaseRef.contentHash !==
      input.profile.runtimeReleaseRef.contentHash
    || stableAuthorityStringify(input.exact.deploymentProfileRef) !==
      stableAuthorityStringify(input.references.deploymentProfileRef)
    || stableAuthorityStringify(input.exact.modelUploadObservationRef) !==
      stableAuthorityStringify(input.references.modelUploadObservationRef)
    || stableAuthorityStringify(input.exact.endpointCreateObservationRef) !==
      stableAuthorityStringify(input.references.endpointCreateObservationRef)
    || stableAuthorityStringify(input.exact.modelDeployObservationRef) !==
      stableAuthorityStringify(input.references.modelDeployObservationRef)
  ) throw new Error('Exact Vertex deployment lineage changed.')
}
