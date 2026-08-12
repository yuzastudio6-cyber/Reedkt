import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'

import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_DEDICATED_PREDICTION_ROUTE_VERSION =
  'canonical-sam3_1-vertex-dedicated-prediction-route-v2' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com'
const ENDPOINT_RESOURCE = CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE
const NUMERIC_ENDPOINT_RESOURCE =
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE
const DEPLOYED_MODEL_ID = CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const dedicatedDns = z.string().regex(
  /^weeditpro-sam31-a100-scale-zero-v1\.us-central1-[a-z0-9-]+\.prediction\.vertexai\.goog$/u,
)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

const routeWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_DEDICATED_PREDICTION_ROUTE_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_dedicated_prediction_route_reader',
  ),
  endpointResourceName: z.literal(ENDPOINT_RESOURCE),
  deployedModelId: z.literal(DEPLOYED_MODEL_ID),
  dedicatedEndpointDns: dedicatedDns,
  predictUrl: z.string().url().refine((value) =>
    value.endsWith(`/v1/${ENDPOINT_RESOURCE}:predict`),
  ),
  dedicatedEndpointEnabled: z.literal(true),
  oneExactDeployedModel: z.literal(true),
  exactTrafficSplitPercent: z.literal(100),
  callerPredictionUrlAccepted: z.literal(false),
}).strict().superRefine((route, context) => {
  if (route.predictUrl !==
    `https://${route.dedicatedEndpointDns}/v1/${ENDPOINT_RESOURCE}:predict`) {
    context.addIssue({
      code: 'custom',
      message: 'Dedicated Vertex prediction route changed.',
    })
  }
})

export const canonicalSam31VertexDedicatedPredictionRouteSchema =
  routeWithoutHashSchema.extend({ routeHash: sha256 }).strict()
export type CanonicalSam31VertexDedicatedPredictionRoute = z.infer<
  typeof canonicalSam31VertexDedicatedPredictionRouteSchema
>

export async function rereadCanonicalSam31VertexDedicatedPredictionRoute(
  input: {
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly timeoutMilliseconds?: number
  } = {},
): Promise<CanonicalSam31VertexDedicatedPredictionRoute> {
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('Dedicated Vertex route reread timeout changed.')
  }
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const response = await auth.request({
    url: `${API_ORIGIN}/v1beta1/${ENDPOINT_RESOURCE}`,
    method: 'GET',
    timeout,
    retry: false,
    maxRedirects: 0,
    responseType: 'json',
    maxContentLength: 2 * 1024 * 1024,
  })
  assertPlainSerializedData(
    response.data,
    'sam31_vertex_dedicated_prediction_endpoint',
  )
  const endpoint = z.object({
    name: z.enum([ENDPOINT_RESOURCE, NUMERIC_ENDPOINT_RESOURCE]),
    displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    dedicatedEndpointEnabled: z.literal(true),
    dedicatedEndpointDns: dedicatedDns,
    deployedModels: z.array(z.object({
      id: z.literal(DEPLOYED_MODEL_ID),
      model: z.enum([
        CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
        CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
      ]),
      modelVersionId: z.literal(
        CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
      ).optional().default(CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID),
    }).passthrough()).length(1),
    trafficSplit: z.record(z.string(), z.number().int().nonnegative().safe()),
  }).passthrough().parse(response.data)
  if (
    Object.keys(endpoint.trafficSplit).length !== 1
    || endpoint.trafficSplit[DEPLOYED_MODEL_ID] !== 100
  ) throw new Error('Dedicated Vertex route traffic split changed.')
  const payload = routeWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_DEDICATED_PREDICTION_ROUTE_VERSION,
    source: 'canonical_server_vertex_dedicated_prediction_route_reader',
    endpointResourceName: ENDPOINT_RESOURCE,
    deployedModelId: DEPLOYED_MODEL_ID,
    dedicatedEndpointDns: endpoint.dedicatedEndpointDns,
    predictUrl:
      `https://${endpoint.dedicatedEndpointDns}/v1/${ENDPOINT_RESOURCE}:predict`,
    dedicatedEndpointEnabled: true,
    oneExactDeployedModel: true,
    exactTrafficSplitPercent: 100,
    callerPredictionUrlAccepted: false,
  })
  return canonicalSam31VertexDedicatedPredictionRouteSchema.parse({
    ...payload,
    routeHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexDedicatedPredictionRoute(
  value: unknown,
): CanonicalSam31VertexDedicatedPredictionRoute {
  assertPlainSerializedData(value, 'sam31_vertex_dedicated_prediction_route')
  const parsed = canonicalSam31VertexDedicatedPredictionRouteSchema.parse(
    value,
  )
  const { routeHash, ...payload } = parsed
  if (routeHash !== sha256AuthorityValue(payload)) {
    throw new Error('Dedicated Vertex prediction route digest changed.')
  }
  return parsed
}
