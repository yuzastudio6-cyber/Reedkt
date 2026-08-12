import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  assertCanonicalSam31CompleteSourceCapacityObservation,
} from './canonical-sam3_1-complete-source-capacity-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_OBSERVATION_VERSION =
  'canonical-sam3_1-vertex-serving-capacity-observation-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_MUTATION_REQUEST_VERSION =
  'canonical-sam3_1-vertex-serving-capacity-mutation-request-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const API_ORIGIN = `https://${REGION}-aiplatform.googleapis.com` as const
const ENDPOINT = CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE
const NUMERIC_ENDPOINT =
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE
const DEPLOYED_MODEL_ID = CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID
const MODEL_VERSION_ID = CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID
const REQUIRED_MAXIMUM_REPLICA_COUNT = 16 as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const MAXIMUM_OBSERVATION_AGE_MILLISECONDS = 15 * 60_000

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_current_serving_capacity_reader',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  endpointResourceName: z.literal(ENDPOINT),
  deployedModelId: z.literal(DEPLOYED_MODEL_ID),
  modelVersionId: z.literal(MODEL_VERSION_ID),
  routeId: z.literal('a100_80gb_heavy_primary'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCount: z.literal(1),
  minimumReplicaCount: z.literal(0),
  initialReplicaCount: z.literal(1),
  maximumReplicaCount: z.number().int().min(1).max(
    REQUIRED_MAXIMUM_REPLICA_COUNT,
  ),
  requiredMaximumReplicaCount: z.literal(REQUIRED_MAXIMUM_REPLICA_COUNT),
  minimumScaleUpPeriodSeconds: z.literal(300),
  idleScaleDownPeriodSeconds: z.literal(300),
  dedicatedEndpointEnabled: z.literal(true),
  oneExactDeployedModel: z.literal(true),
  exactTrafficSplitPercent: z.literal(100),
  requestResponseLoggingEnabled: z.literal(false),
  containerLoggingEnabled: z.literal(false),
  exactCurrentEndpointModelVersionTrafficAndCapacityReread: z.literal(true),
  currentEndpointMeetsCompleteSourceCapacity: z.boolean(),
  endpointOrGpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  const ready = value.maximumReplicaCount >=
    value.requiredMaximumReplicaCount
  const age = Date.parse(value.expiresAt) - Date.parse(value.observedAt)
  if (value.currentEndpointMeetsCompleteSourceCapacity !== ready
    || age <= 0 || age > MAXIMUM_OBSERVATION_AGE_MILLISECONDS) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex serving capacity observation is inconsistent.',
    })
  }
})
export const canonicalSam31VertexServingCapacityObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31VertexServingCapacityObservation = z.infer<
  typeof canonicalSam31VertexServingCapacityObservationSchema
>

const mutationBodySchema = z.object({
  deployedModel: z.object({
    id: z.literal(DEPLOYED_MODEL_ID),
    dedicatedResources: z.object({
      minReplicaCount: z.literal(0),
      initialReplicaCount: z.literal(1),
      maxReplicaCount: z.literal(REQUIRED_MAXIMUM_REPLICA_COUNT),
      scaleToZeroSpec: z.object({
        minScaleupPeriod: z.literal('300s'),
        idleScaledownPeriod: z.literal('300s'),
      }).strict(),
    }).strict(),
  }).strict(),
  updateMask: z.literal([
    'dedicatedResources.minReplicaCount',
    'dedicatedResources.initialReplicaCount',
    'dedicatedResources.maxReplicaCount',
    'dedicatedResources.scaleToZeroSpec',
  ].join(',')),
}).strict()

const mutationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_MUTATION_REQUEST_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_serving_capacity_mutation_compiler',
  ),
  capacityObservationRef: refSchema,
  completeSourceCapacityObservationRef: refSchema,
  method: z.literal('POST'),
  url: z.literal(`${API_ORIGIN}/v1beta1/${ENDPOINT}:mutateDeployedModel`),
  contentType: z.literal('application/json'),
  body: mutationBodySchema,
  priorMaximumReplicaCount: z.number().int().min(1).max(15),
  requestedMaximumReplicaCount: z.literal(REQUIRED_MAXIMUM_REPLICA_COUNT),
  exactCurrentEndpointAndQuotaRereadBeforeMutation: z.literal(true),
  callerEndpointModelGpuScaleOrPriceAccepted: z.literal(false),
  gpuInferenceOrCustomerInvocationStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  compiledAt: timestamp,
}).strict()
export const canonicalSam31VertexServingCapacityMutationRequestSchema =
  mutationWithoutHashSchema.extend({ requestDigestSha256: sha256 }).strict()
export type CanonicalSam31VertexServingCapacityMutationRequest = z.infer<
  typeof canonicalSam31VertexServingCapacityMutationRequestSchema
>

export async function rereadCanonicalSam31VertexServingCapacity(input: {
  readonly auth?: Pick<GoogleAuth, 'request'>
  readonly now?: () => string
  readonly timeoutMilliseconds?: number
} = {}): Promise<CanonicalSam31VertexServingCapacityObservation> {
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('Vertex serving capacity request timeout changed.')
  }
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const response = await auth.request({
    url: `${API_ORIGIN}/v1beta1/${ENDPOINT}`,
    method: 'GET', timeout, retry: false, maxRedirects: 0,
    responseType: 'json', maxContentLength: 2 * 1024 * 1024,
  })
  assertPlainSerializedData(response.data, 'sam31_vertex_serving_capacity')
  const int64 = z.union([
    z.number().int().nonnegative().safe(),
    z.string().regex(/^(?:0|[1-9][0-9]*)$/u).transform(Number),
  ])
  const endpoint = z.object({
    name: z.enum([ENDPOINT, NUMERIC_ENDPOINT]),
    dedicatedEndpointEnabled: z.literal(true),
    deployedModels: z.array(z.object({
      id: z.literal(DEPLOYED_MODEL_ID),
      model: z.enum([
        CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
        CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
      ]),
      modelVersionId: z.literal(MODEL_VERSION_ID).optional()
        .default(MODEL_VERSION_ID),
      enableAccessLogging: z.literal(false).optional(),
      disableContainerLogging: z.literal(true),
      dedicatedResources: z.object({
        machineSpec: z.object({
          machineType: z.literal('a2-ultragpu-1g'),
          acceleratorType: z.literal('NVIDIA_A100_80GB'),
          acceleratorCount: int64,
        }).passthrough(),
        minReplicaCount: int64.optional().default(0),
        initialReplicaCount: int64.optional().default(1),
        maxReplicaCount: int64,
        scaleToZeroSpec: z.object({
          minScaleupPeriod: z.literal('300s'),
          idleScaledownPeriod: z.literal('300s'),
        }).strict(),
      }).passthrough(),
    }).passthrough()).length(1),
    trafficSplit: z.record(z.string(), z.number().int().min(0).max(100)),
  }).passthrough().parse(response.data)
  const deployed = endpoint.deployedModels[0]!
  if (deployed.dedicatedResources.machineSpec.acceleratorCount !== 1
    || deployed.dedicatedResources.minReplicaCount !== 0
    || deployed.dedicatedResources.initialReplicaCount !== 1
    || Object.keys(endpoint.trafficSplit).length !== 1
    || endpoint.trafficSplit[DEPLOYED_MODEL_ID] !== 100) {
    throw new Error('Vertex serving capacity endpoint shape changed.')
  }
  const observedAt = timestamp.parse((input.now ?? (() =>
    new Date().toISOString()))())
  return sealCanonicalSam31VertexServingCapacityObservation({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_OBSERVATION_VERSION,
    source: 'canonical_server_vertex_current_serving_capacity_reader',
    evidenceClass: 'canonical_private_reread',
    endpointResourceName: ENDPOINT,
    deployedModelId: DEPLOYED_MODEL_ID,
    modelVersionId: MODEL_VERSION_ID,
    routeId: 'a100_80gb_heavy_primary',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCount: 1,
    minimumReplicaCount: 0,
    initialReplicaCount: 1,
    maximumReplicaCount: deployed.dedicatedResources.maxReplicaCount,
    requiredMaximumReplicaCount: REQUIRED_MAXIMUM_REPLICA_COUNT,
    minimumScaleUpPeriodSeconds: 300,
    idleScaleDownPeriodSeconds: 300,
    dedicatedEndpointEnabled: true,
    oneExactDeployedModel: true,
    exactTrafficSplitPercent: 100,
    requestResponseLoggingEnabled: false,
    containerLoggingEnabled: false,
    exactCurrentEndpointModelVersionTrafficAndCapacityReread: true,
    currentEndpointMeetsCompleteSourceCapacity:
      deployed.dedicatedResources.maxReplicaCount >=
        REQUIRED_MAXIMUM_REPLICA_COUNT,
    endpointOrGpuJobStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
    observedAt,
    expiresAt: new Date(Date.parse(observedAt)
      + MAXIMUM_OBSERVATION_AGE_MILLISECONDS).toISOString(),
  })
}

export function compileCanonicalSam31VertexServingCapacityMutation(input: {
  readonly capacityObservation: unknown
  readonly completeSourceCapacityObservation: unknown
  readonly compiledAt: string
}): CanonicalSam31VertexServingCapacityMutationRequest {
  assertPlainSerializedData(input, 'sam31_vertex_capacity_mutation_compile')
  const compiledAt = timestamp.parse(input.compiledAt)
  const capacity = assertCanonicalSam31VertexServingCapacityObservation(
    input.capacityObservation,
    compiledAt,
  )
  const complete = assertCanonicalSam31CompleteSourceCapacityObservation(
    input.completeSourceCapacityObservation,
    compiledAt,
  )
  if (capacity.currentEndpointMeetsCompleteSourceCapacity
    || capacity.maximumReplicaCount >= REQUIRED_MAXIMUM_REPLICA_COUNT) {
    throw new Error('Vertex serving endpoint already has required capacity.')
  }
  if (!complete.completeSourceExecutionCapacityReady
    || complete.status !== 'ready_for_eight_minute_complete_source_execution'
    || complete.a100GrantedValue < REQUIRED_MAXIMUM_REPLICA_COUNT
    || complete.a100Reconciling) {
    throw new Error('Vertex A100 serving quota is not ready for mutation.')
  }
  const payload = mutationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_MUTATION_REQUEST_VERSION,
    source: 'canonical_server_vertex_serving_capacity_mutation_compiler',
    capacityObservationRef: ref(
      `sam31-vertex-serving-capacity:${capacity.observationHash}`,
      capacity.observationHash,
    ),
    completeSourceCapacityObservationRef: ref(
      complete.observationId,
      complete.observationHash,
    ),
    method: 'POST',
    url: `${API_ORIGIN}/v1beta1/${ENDPOINT}:mutateDeployedModel`,
    contentType: 'application/json',
    body: {
      deployedModel: {
        id: DEPLOYED_MODEL_ID,
        dedicatedResources: {
          minReplicaCount: 0,
          initialReplicaCount: 1,
          maxReplicaCount: REQUIRED_MAXIMUM_REPLICA_COUNT,
          scaleToZeroSpec: {
            minScaleupPeriod: '300s',
            idleScaledownPeriod: '300s',
          },
        },
      },
      updateMask: [
        'dedicatedResources.minReplicaCount',
        'dedicatedResources.initialReplicaCount',
        'dedicatedResources.maxReplicaCount',
        'dedicatedResources.scaleToZeroSpec',
      ].join(','),
    },
    priorMaximumReplicaCount: capacity.maximumReplicaCount,
    requestedMaximumReplicaCount: REQUIRED_MAXIMUM_REPLICA_COUNT,
    exactCurrentEndpointAndQuotaRereadBeforeMutation: true,
    callerEndpointModelGpuScaleOrPriceAccepted: false,
    gpuInferenceOrCustomerInvocationStarted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    compiledAt,
  })
  return canonicalSam31VertexServingCapacityMutationRequestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  })
}

export function sealCanonicalSam31VertexServingCapacityObservation(
  value: unknown,
): CanonicalSam31VertexServingCapacityObservation {
  assertPlainSerializedData(value, 'sam31_vertex_capacity_observation_build')
  const payload = observationWithoutHashSchema.parse(value)
  return assertCanonicalSam31VertexServingCapacityObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexServingCapacityObservation(
  value: unknown,
  at?: string,
): CanonicalSam31VertexServingCapacityObservation {
  assertPlainSerializedData(value, 'sam31_vertex_capacity_observation')
  const parsed = canonicalSam31VertexServingCapacityObservationSchema.parse(
    value,
  )
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw new Error('Vertex serving capacity observation is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingCapacityMutationRequest(
  value: unknown,
): CanonicalSam31VertexServingCapacityMutationRequest {
  assertPlainSerializedData(value, 'sam31_vertex_capacity_mutation_request')
  const parsed = canonicalSam31VertexServingCapacityMutationRequestSchema
    .parse(value)
  const { requestDigestSha256, ...payload } = parsed
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving capacity mutation digest changed.')
  }
  return parsed
}

function ref(id: string, hash: string) {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

export function requiredA100ServingReplicaCapacity(): number {
  return REQUIRED_MAXIMUM_REPLICA_COUNT
}

export const CANONICAL_SAM3_1_VERTEX_SERVING_CAPACITY_PROJECT = PROJECT_ID
