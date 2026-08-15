import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentRequest,
  type CanonicalSam31VertexScaleZeroDeploymentRequest,
} from './canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_SUBMISSION_VERSION =
  'canonical-sam3_1-vertex-scale-zero-control-plane-submission-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_OBSERVATION_VERSION =
  'canonical-sam3_1-vertex-scale-zero-control-plane-observation-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const stage = z.enum(['model_upload', 'endpoint_create', 'model_deploy'])
const operationName = z.string().regex(
  /^projects\/(?:reeditpro|390722338345)\/locations\/us-central1\/(?:(?:models|endpoints)\/[a-z0-9_-]{1,63}\/)?operations\/[A-Za-z0-9_-]{1,160}$/u,
)
const CANONICAL_MODEL_RESOURCE =
  'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const
const NUMERIC_MODEL_RESOURCE =
  'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1' as const
const CANONICAL_ENDPOINT_RESOURCE =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const NUMERIC_ENDPOINT_RESOURCE =
  'projects/390722338345/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const modelResourceName = z.literal(CANONICAL_MODEL_RESOURCE)
const observedModelResourceName = z.enum([
  CANONICAL_MODEL_RESOURCE, NUMERIC_MODEL_RESOURCE,
])
const endpointResourceName = z.literal(CANONICAL_ENDPOINT_RESOURCE)
const observedEndpointResourceName = z.enum([
  CANONICAL_ENDPOINT_RESOURCE, NUMERIC_ENDPOINT_RESOURCE,
])
const deployedModelId = z.string().regex(/^[0-9]{1,10}$/u)
const exactDeployedModelId = z.literal('3101000001')
const modelResourceFromRequest = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/models\/[a-z0-9_-]{1,63}$/u,
)

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_SUBMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_backend_sam3_1_vertex_scale_zero_control_plane',
  ),
  stage,
  requestDigestSha256: sha256,
  disposition: z.enum([
    'submitted',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerCallStarted: z.literal(true),
  providerOutcome: z.enum(['executed', 'unknown']),
  operationName: operationName.nullable(),
  automaticRetryAllowed: z.literal(false),
  callerCloudResourceSelectionAccepted: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  submittedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  if (
    submitted !== (value.providerOutcome === 'executed')
    || submitted !== (value.operationName !== null)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex scale-zero submission outcome is inconsistent.',
  })
})
const submissionSchema = submissionWithoutHashSchema.extend({
  submissionHash: sha256,
}).strict()
export type CanonicalSam31VertexScaleZeroControlPlaneSubmission = z.infer<
  typeof submissionSchema
>

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_backend_sam3_1_vertex_scale_zero_control_plane',
  ),
  stage,
  requestDigestSha256: sha256,
  submissionHash: sha256,
  operationName: operationName.nullable(),
  disposition: z.enum(['pending', 'completed', 'terminal_failure']),
  operationDone: z.boolean(),
  modelResourceName: modelResourceName.nullable(),
  endpointResourceName: endpointResourceName.nullable(),
  deployedModelId: deployedModelId.nullable(),
  providerErrorRef: z.object({
    code: z.number().int().nonnegative().safe(),
    messageDigestSha256: sha256,
  }).strict().nullable(),
  observationMode: z.enum([
    'exact_operation_reread',
    'exact_resource_reconciliation',
  ]),
  exactOperationReread: z.boolean(),
  exactResourceReread: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const pending = value.disposition === 'pending'
  const failed = value.disposition === 'terminal_failure'
  const completed = value.disposition === 'completed'
  const exactStageResult = value.stage === 'model_upload'
    ? value.modelResourceName !== null
      && value.endpointResourceName === null
      && value.deployedModelId === null
    : value.stage === 'endpoint_create'
      ? value.modelResourceName === null
        && value.endpointResourceName !== null
        && value.deployedModelId === null
      : value.modelResourceName === null
        && value.endpointResourceName === null
        && value.deployedModelId !== null
  if (
    pending !== !value.operationDone
    || failed !== (value.providerErrorRef !== null)
    || (completed && !exactStageResult)
    || (!completed && (
      value.modelResourceName !== null
      || value.endpointResourceName !== null
      || value.deployedModelId !== null
    ))
    || (value.observationMode === 'exact_operation_reread' && (
      value.operationName === null
      || !value.exactOperationReread
      || value.exactResourceReread
    ))
    || (value.observationMode === 'exact_resource_reconciliation' && (
      value.operationName !== null
      || value.exactOperationReread
      || !value.exactResourceReread
      || !completed
    ))
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex scale-zero operation observation is inconsistent.',
  })
})
const observationSchema = observationWithoutHashSchema.extend({
  observationHash: sha256,
}).strict()
export type CanonicalSam31VertexScaleZeroControlPlaneObservation = z.infer<
  typeof observationSchema
>

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalSam31VertexScaleZeroControlPlane(input: {
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly timeoutMilliseconds?: number
} = {}) {
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('Vertex scale-zero control-plane timeout is invalid.')
  }
  return Object.freeze({
    async submitOne(
      value: CanonicalSam31VertexScaleZeroDeploymentRequest,
    ): Promise<CanonicalSam31VertexScaleZeroControlPlaneSubmission> {
      const request =
        assertCanonicalSam31VertexScaleZeroDeploymentRequest(value)
      const submittedAt = timestamp.parse(now())
      try {
        const response = await auth.request({
          url: request.url,
          method: request.method,
          data: structuredClone(request.body),
          timeout,
          retry: false,
          maxRedirects: 0,
          responseType: 'json',
          maxContentLength: 2 * 1024 * 1024,
        })
        const provider = z.object({ name: operationName }).passthrough()
          .parse(response.data)
        return submission({
          stage: request.stage,
          requestDigestSha256: request.requestDigestSha256,
          disposition: 'submitted',
          providerOutcome: 'executed',
          operationName: provider.name,
          submittedAt,
        })
      } catch {
        return submission({
          stage: request.stage,
          requestDigestSha256: request.requestDigestSha256,
          disposition: 'outcome_unknown_requires_reconciliation',
          providerOutcome: 'unknown',
          operationName: null,
          submittedAt,
        })
      }
    },

    async observeOne(inputValue: {
      readonly submission:
        CanonicalSam31VertexScaleZeroControlPlaneSubmission
    }): Promise<CanonicalSam31VertexScaleZeroControlPlaneObservation> {
      const accepted = assertCanonicalSam31VertexScaleZeroControlPlaneSubmission(
        inputValue.submission,
      )
      if (accepted.operationName === null) {
        throw new Error('Unknown Vertex submission must be reconciled first.')
      }
      const response = await auth.request({
        url: `${API_ORIGIN}/v1beta1/${accepted.operationName}`,
        method: 'GET',
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        maxContentLength: 2 * 1024 * 1024,
      })
      const operation = z.object({
        name: z.literal(accepted.operationName),
        done: z.boolean().optional(),
        error: z.object({
          code: z.number().int().nonnegative().safe(),
          message: z.string().min(1).max(16_384),
        }).passthrough().optional(),
        response: z.record(z.string(), z.unknown()).optional(),
      }).passthrough().parse(response.data)
      return observation(accepted, operation, timestamp.parse(now()))
    },

    async reconcileUnknown(inputValue: {
      readonly request: CanonicalSam31VertexScaleZeroDeploymentRequest
      readonly unknownSubmission:
        CanonicalSam31VertexScaleZeroControlPlaneSubmission
    }): Promise<CanonicalSam31VertexScaleZeroControlPlaneObservation | null> {
      const request =
        assertCanonicalSam31VertexScaleZeroDeploymentRequest(inputValue.request)
      const unknown = assertCanonicalSam31VertexScaleZeroControlPlaneSubmission(
        inputValue.unknownSubmission,
      )
      if (
        unknown.disposition !== 'outcome_unknown_requires_reconciliation'
        || unknown.providerOutcome !== 'unknown'
        || unknown.operationName !== null
        || unknown.stage !== request.stage
        || unknown.requestDigestSha256 !== request.requestDigestSha256
      ) throw new Error('Unknown Vertex deployment lineage changed.')
      const observedAt = timestamp.parse(now())
      try {
        if (request.stage === 'model_upload') {
          const response = await auth.request({
            url: `${API_ORIGIN}/v1beta1/projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1`,
            method: 'GET', timeout, retry: false, maxRedirects: 0,
            responseType: 'json', maxContentLength: 2 * 1024 * 1024,
          })
          const model = parseExactModelResource(response.data, request)
          return reconciledObservation(unknown, request, observedAt, {
            modelResourceName: model.name,
            endpointResourceName: null,
            deployedModelId: null,
          })
        }
        const response = await auth.request({
          url: `${API_ORIGIN}/v1beta1/projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        })
        const endpoint = parseExactEndpointResource(response.data)
        if (request.stage === 'endpoint_create') {
          return reconciledObservation(unknown, request, observedAt, {
            modelResourceName: null,
            endpointResourceName: endpoint.name,
            deployedModelId: null,
          })
        }
        const expectedModel = z.object({
          deployedModel: z.object({
            model: modelResourceFromRequest,
            id: exactDeployedModelId,
            serviceAccount: z.literal(
              'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
            ),
            dedicatedResources: z.object({
              machineSpec: z.object({
                machineType: z.literal('a2-ultragpu-1g'),
                acceleratorType: z.literal('NVIDIA_A100_80GB'),
                acceleratorCount: z.literal(1),
              }).passthrough(),
              minReplicaCount: z.literal(0),
              initialReplicaCount: z.literal(1),
              maxReplicaCount: z.literal(1),
              scaleToZeroSpec: z.object({
                minScaleupPeriod: z.literal('300s'),
                idleScaledownPeriod: z.literal('300s'),
              }).strict(),
              spot: z.literal(false),
            }).passthrough(),
          }).passthrough(),
        }).passthrough().parse(request.body).deployedModel
        const found = endpoint.deployedModels.find((candidate) =>
          candidate.id === expectedModel.id)
        if (
          !found
          || canonicalModelResource(found.model) !== expectedModel.model
          || found.serviceAccount !== expectedModel.serviceAccount
          || stableAuthorityStringify(found.dedicatedResources.machineSpec) !==
            stableAuthorityStringify(
              expectedModel.dedicatedResources.machineSpec,
            )
          || found.dedicatedResources.minReplicaCount !== 0
          || found.dedicatedResources.initialReplicaCount !== 1
          || found.dedicatedResources.maxReplicaCount !== 1
          || stableAuthorityStringify(
            found.dedicatedResources.scaleToZeroSpec,
          ) !== stableAuthorityStringify(
            expectedModel.dedicatedResources.scaleToZeroSpec,
          )
          || found.dedicatedResources.spot !== false
          || endpoint.trafficSplit[expectedModel.id] !== 100
          || Object.keys(endpoint.trafficSplit).length !== 1
        ) return null
        return reconciledObservation(unknown, request, observedAt, {
          modelResourceName: null,
          endpointResourceName: null,
          deployedModelId: found.id,
        })
      } catch (error) {
        if (cloudStatus(error) === 404) return null
        throw error
      }
    },
  })
}

export function assertCanonicalSam31VertexScaleZeroControlPlaneSubmission(
  value: unknown,
): CanonicalSam31VertexScaleZeroControlPlaneSubmission {
  const parsed = submissionSchema.parse(value)
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex scale-zero submission digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexScaleZeroControlPlaneObservation(
  value: unknown,
): CanonicalSam31VertexScaleZeroControlPlaneObservation {
  const parsed = observationSchema.parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex scale-zero observation digest changed.')
  }
  return parsed
}

/**
 * Reconstructs the only safe state after a durable consumption exists but no
 * provider response was committed. It never authorizes another POST; callers
 * may only reconcile the fixed model/endpoint/deployed-model resource.
 */
export function createCanonicalSam31VertexScaleZeroUnknownSubmission(input: {
  readonly request: CanonicalSam31VertexScaleZeroDeploymentRequest
  readonly consumedAt: string
}): CanonicalSam31VertexScaleZeroControlPlaneSubmission {
  const request = assertCanonicalSam31VertexScaleZeroDeploymentRequest(
    input.request,
  )
  return submission({
    stage: request.stage,
    requestDigestSha256: request.requestDigestSha256,
    disposition: 'outcome_unknown_requires_reconciliation',
    providerOutcome: 'unknown',
    operationName: null,
    submittedAt: timestamp.parse(input.consumedAt),
  })
}

function submission(input: {
  readonly stage: z.infer<typeof stage>
  readonly requestDigestSha256: string
  readonly disposition: 'submitted' | 'outcome_unknown_requires_reconciliation'
  readonly providerOutcome: 'executed' | 'unknown'
  readonly operationName: string | null
  readonly submittedAt: string
}): CanonicalSam31VertexScaleZeroControlPlaneSubmission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_SUBMISSION_VERSION,
    source: 'canonical_backend_sam3_1_vertex_scale_zero_control_plane',
    ...input,
    providerCallStarted: true,
    automaticRetryAllowed: false,
    callerCloudResourceSelectionAccepted: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return submissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function observation(
  submissionValue: CanonicalSam31VertexScaleZeroControlPlaneSubmission,
  operation: {
    readonly name: string
    readonly done?: boolean
    readonly error?: { readonly code: number; readonly message: string }
    readonly response?: Record<string, unknown>
  },
  observedAt: string,
): CanonicalSam31VertexScaleZeroControlPlaneObservation {
  const done = operation.done === true
  const failed = done && operation.error !== undefined
  const disposition = !done
    ? 'pending' as const
    : failed
      ? 'terminal_failure' as const
      : 'completed' as const
  const stageResult = disposition === 'completed'
    ? parseStageResult(submissionValue.stage, operation.response)
    : {
        modelResourceName: null,
        endpointResourceName: null,
        deployedModelId: null,
      }
  const payload = observationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_OBSERVATION_VERSION,
    source: 'canonical_backend_sam3_1_vertex_scale_zero_control_plane',
    stage: submissionValue.stage,
    requestDigestSha256: submissionValue.requestDigestSha256,
    submissionHash: submissionValue.submissionHash,
    operationName: operation.name,
    disposition,
    operationDone: done,
    ...stageResult,
    providerErrorRef: failed
      ? {
          code: operation.error?.code,
          messageDigestSha256: sha256AuthorityValue(
            operation.error?.message ?? '',
          ),
        }
      : null,
    observationMode: 'exact_operation_reread',
    exactOperationReread: true,
    exactResourceReread: false,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
    observedAt,
  })
  return observationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function parseStageResult(
  value: z.infer<typeof stage>,
  response: Record<string, unknown> | undefined,
) {
  if (value === 'model_upload') {
    const parsed = z.object({ model: observedModelResourceName }).passthrough()
      .parse(response)
    return {
      modelResourceName: canonicalModelResource(parsed.model),
      endpointResourceName: null,
      deployedModelId: null,
    }
  }
  if (value === 'endpoint_create') {
    const parsed = z.object({ name: observedEndpointResourceName }).passthrough()
      .parse(response)
    return {
      modelResourceName: null,
      endpointResourceName: canonicalEndpointResource(parsed.name),
      deployedModelId: null,
    }
  }
  const parsed = z.object({
    deployedModel: z.object({ id: deployedModelId }).passthrough(),
  }).passthrough().parse(response)
  return {
    modelResourceName: null,
    endpointResourceName: null,
    deployedModelId: parsed.deployedModel.id,
  }
}

const deployedModelResourceSchema = z.object({
  id: exactDeployedModelId,
  model: observedModelResourceName,
  serviceAccount: z.literal(
    'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
  ),
  enableAccessLogging: z.literal(false).optional(),
  disableContainerLogging: z.literal(false),
  dedicatedResources: z.object({
    machineSpec: z.object({
      machineType: z.literal('a2-ultragpu-1g'),
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
    spot: z.literal(false),
  }).passthrough(),
}).passthrough()

function parseExactEndpointResource(value: unknown) {
  const parsed = z.object({
    name: observedEndpointResourceName,
    displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    dedicatedEndpointEnabled: z.literal(true),
    predictRequestResponseLoggingConfig: z.object({
      enabled: z.literal(false),
    }).passthrough().optional(),
    deployedModels: z.array(deployedModelResourceSchema).max(1).default([]),
    trafficSplit: z.record(z.string(), z.number().int().nonnegative().safe())
      .default({}),
  }).passthrough().parse(value)
  return { ...parsed, name: canonicalEndpointResource(parsed.name) }
}

function parseExactModelResource(
  value: unknown,
  request: CanonicalSam31VertexScaleZeroDeploymentRequest,
) {
  const requested = z.object({
    modelId: z.literal('weeditpro-sam31-a100-scale-zero-v1'),
    model: z.object({
      displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
      containerSpec: z.object({
        imageUri: z.string().min(1),
        ports: z.array(z.object({ containerPort: z.literal(8080) }).strict())
          .length(1),
        healthRoute: z.literal('/health'),
        predictRoute: z.literal('/predict'),
        deploymentTimeout: z.literal('1800s'),
        startupProbe: z.object({
          httpGet: z.object({
            path: z.literal('/health'),
            port: z.literal(8080),
          }).strict(),
          initialDelaySeconds: z.literal(0),
          periodSeconds: z.literal(10),
          timeoutSeconds: z.literal(10),
          failureThreshold: z.literal(120),
          successThreshold: z.literal(1),
        }).strict(),
        env: z.array(z.object({ name: z.string(), value: z.string() }).strict())
          .length(2),
      }).strict(),
    }).passthrough(),
  }).strict().parse(request.body)
  const observed = z.object({
    name: observedModelResourceName,
    displayName: z.literal(requested.model.displayName),
    containerSpec: z.object({
      imageUri: z.literal(requested.model.containerSpec.imageUri),
      ports: z.array(z.object({ containerPort: z.literal(8080) }).passthrough())
        .length(1),
      healthRoute: z.literal('/health'),
      predictRoute: z.literal('/predict'),
      deploymentTimeout: z.literal(
        requested.model.containerSpec.deploymentTimeout,
      ),
      startupProbe: z.object({
        httpGet: z.object({
          path: z.literal('/health'),
          port: z.literal(8080),
        }).passthrough(),
        initialDelaySeconds: z.literal(0),
        periodSeconds: z.literal(10),
        timeoutSeconds: z.literal(10),
        failureThreshold: z.literal(120),
        successThreshold: z.literal(1),
      }).passthrough(),
      env: z.array(z.object({ name: z.string(), value: z.string() }).passthrough())
        .length(2),
    }).passthrough(),
  }).passthrough().parse(value)
  const environment = new Map(observed.containerSpec.env.map((item) =>
    [item.name, item.value]))
  if (
    environment.size !== 2
    || environment.get('WEEDITPRO_SAM31_RUNTIME_MODE') !==
      'vertex_prediction_endpoint_v1'
    || environment.get('WEEDITPRO_GPU_ACCELERATOR_CLASS') !==
      'nvidia_a100_80gb'
  ) throw new Error('Reconciled Vertex model environment changed.')
  return { ...observed, name: canonicalModelResource(observed.name) }
}

function canonicalModelResource(
  value: z.infer<typeof observedModelResourceName>,
): typeof CANONICAL_MODEL_RESOURCE {
  if (value !== CANONICAL_MODEL_RESOURCE && value !== NUMERIC_MODEL_RESOURCE) {
    throw new Error('Observed Vertex model resource changed project scope.')
  }
  return CANONICAL_MODEL_RESOURCE
}

function canonicalEndpointResource(
  value: z.infer<typeof observedEndpointResourceName>,
): typeof CANONICAL_ENDPOINT_RESOURCE {
  if (
    value !== CANONICAL_ENDPOINT_RESOURCE
    && value !== NUMERIC_ENDPOINT_RESOURCE
  ) throw new Error('Observed Vertex endpoint changed project scope.')
  return CANONICAL_ENDPOINT_RESOURCE
}

function reconciledObservation(
  unknown: CanonicalSam31VertexScaleZeroControlPlaneSubmission,
  request: CanonicalSam31VertexScaleZeroDeploymentRequest,
  observedAt: string,
  stageResult: {
    readonly modelResourceName: string | null
    readonly endpointResourceName:
      | 'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1'
      | null
    readonly deployedModelId: string | null
  },
): CanonicalSam31VertexScaleZeroControlPlaneObservation {
  const payload = observationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_OBSERVATION_VERSION,
    source: 'canonical_backend_sam3_1_vertex_scale_zero_control_plane',
    stage: request.stage,
    requestDigestSha256: request.requestDigestSha256,
    submissionHash: unknown.submissionHash,
    operationName: null,
    disposition: 'completed',
    operationDone: true,
    ...stageResult,
    providerErrorRef: null,
    observationMode: 'exact_resource_reconciliation',
    exactOperationReread: false,
    exactResourceReread: true,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
    observedAt,
  })
  return observationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function cloudStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const responseStatus = 'response' in error
    && error.response && typeof error.response === 'object'
    && 'status' in error.response
    ? Number(error.response.status)
    : undefined
  if (Number.isInteger(responseStatus)) return responseStatus
  return 'code' in error ? Number(error.code) : undefined
}
