import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentRequest,
  type CanonicalSam31VertexScaleZeroDeploymentRequest,
} from './canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'
import {
  sha256AuthorityValue,
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
  /^projects\/(?:reeditpro|390722338345)\/locations\/us-central1\/operations\/[A-Za-z0-9_-]{1,160}$/u,
)
const modelResourceName = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/models\/[a-z0-9_-]{1,63}$/u,
)
const endpointResourceName = z.literal(
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
)
const deployedModelId = z.string().regex(/^[0-9]{1,10}$/u)

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
  operationName,
  disposition: z.enum(['pending', 'completed', 'terminal_failure']),
  operationDone: z.boolean(),
  modelResourceName: modelResourceName.nullable(),
  endpointResourceName: endpointResourceName.nullable(),
  deployedModelId: deployedModelId.nullable(),
  providerErrorRef: z.object({
    code: z.number().int().nonnegative().safe(),
    messageDigestSha256: sha256,
  }).strict().nullable(),
  exactOperationReread: z.literal(true),
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
    exactOperationReread: true,
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
    const parsed = z.object({ model: modelResourceName }).passthrough()
      .parse(response)
    return {
      modelResourceName: parsed.model,
      endpointResourceName: null,
      deployedModelId: null,
    }
  }
  if (value === 'endpoint_create') {
    const parsed = z.object({ name: endpointResourceName }).passthrough()
      .parse(response)
    return {
      modelResourceName: null,
      endpointResourceName: parsed.name,
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
