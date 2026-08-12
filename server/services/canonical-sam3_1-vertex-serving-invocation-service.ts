import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_VERTEX_SERVING_DEPLOYMENT_READY_VERSION =
  'canonical-sam3_1-vertex-serving-deployment-ready-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_INVOCATION_ATTEMPT_VERSION =
  'canonical-sam3_1-vertex-serving-invocation-attempt-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_CALL_START_VERSION =
  'canonical-sam3_1-vertex-serving-call-start-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_INVOCATION_RESULT_VERSION =
  'canonical-sam3_1-vertex-serving-invocation-result-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com'
const ENDPOINT =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const PREDICT_URL = `${API_ORIGIN}/v1/${ENDPOINT}:predict` as const
const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-serving-invocations'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const invocationIdSchema = safeId.max(160)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

const readyWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_DEPLOYMENT_READY_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_scale_zero_deployment_readiness_owner',
  ),
  endpointDeploymentRef: refSchema,
  runtimeReleaseRef: refSchema,
  modelUploadObservationRef: refSchema,
  endpointCreateObservationRef: refSchema,
  modelDeployObservationRef: refSchema,
  endpointResourceName: z.literal(ENDPOINT),
  deployedModelId: z.literal('3101000001'),
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  routeId: z.literal('a100_80gb_heavy_primary'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  minimumReplicaCount: z.literal(0),
  maximumReplicaCount: z.literal(1),
  maximumConcurrentInvocations: z.literal(1),
  exactModelEndpointDeploymentAndTrafficReread: z.literal(true),
  readyForPrivateInvocation: z.literal(true),
  customerInvocationStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((ready, context) => {
  if (Date.parse(ready.expiresAt) <= Date.parse(ready.observedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex serving readiness expiration changed.',
    })
  }
})
export const canonicalSam31VertexServingDeploymentReadySchema =
  readyWithoutHashSchema.extend({ readinessHash: sha256 }).strict()
export type CanonicalSam31VertexServingDeploymentReady = z.infer<
  typeof canonicalSam31VertexServingDeploymentReadySchema
>

const attemptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_INVOCATION_ATTEMPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_invocation_owner',
  ),
  invocationId: invocationIdSchema,
  endpointDeploymentRef: refSchema,
  deploymentReadinessRef: refSchema,
  taskRecordRef: refSchema,
  dispatchAdmissionDigestSha256: sha256,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  attemptState: z.literal('dispatch_admission_consumed'),
  createOnlySingleUseConsumption: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  callerEndpointModelStoragePathUrlOrBytesAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  consumedAt: timestamp,
}).strict()
export const canonicalSam31VertexServingInvocationAttemptSchema =
  attemptWithoutHashSchema.extend({ attemptHash: sha256 }).strict()
export type CanonicalSam31VertexServingInvocationAttempt = z.infer<
  typeof canonicalSam31VertexServingInvocationAttemptSchema
>

const callStartWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_CALL_START_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_invocation_owner',
  ),
  invocationId: invocationIdSchema,
  attemptRef: refSchema,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  callStartState: z.literal('provider_call_started'),
  createOnlyCallStart: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
}).strict()
export const canonicalSam31VertexServingCallStartSchema =
  callStartWithoutHashSchema.extend({ callStartHash: sha256 }).strict()
export type CanonicalSam31VertexServingCallStart = z.infer<
  typeof canonicalSam31VertexServingCallStartSchema
>

const resultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_INVOCATION_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_invocation_owner',
  ),
  invocationId: invocationIdSchema,
  attemptRef: refSchema,
  callStartRef: refSchema,
  disposition: z.enum([
    'completed',
    'failed',
    'outcome_unknown_requires_reconciliation',
  ]),
  runtimeStatus: z.enum(['completed', 'failed']).nullable(),
  runtimeResponseRef: refSchema.nullable(),
  uploadedObjectCount: z.number().int().positive().safe().nullable(),
  uploadedByteLength: z.number().int().positive().safe().nullable(),
  terminalEvidenceMode: z.enum([
    'provider_prediction_and_private_response',
    'private_response_reconciliation',
    'none_unknown',
  ]),
  providerCallStarted: z.literal(true),
  providerOutcome: z.enum(['executed', 'unknown']),
  exactPrivateRuntimeResponseReread: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  unresolvedOutcomeBlocksRetry: z.boolean(),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const unknown = result.disposition ===
    'outcome_unknown_requires_reconciliation'
  const terminal = !unknown
  const prediction = result.terminalEvidenceMode ===
    'provider_prediction_and_private_response'
  const reconciliation = result.terminalEvidenceMode ===
    'private_response_reconciliation'
  if (
    unknown !== (result.providerOutcome === 'unknown')
    || unknown !== result.unresolvedOutcomeBlocksRetry
    || unknown !== (result.terminalEvidenceMode === 'none_unknown')
    || terminal !== result.exactPrivateRuntimeResponseReread
    || terminal !== (result.runtimeStatus !== null)
    || terminal !== (result.runtimeResponseRef !== null)
    || prediction !== (result.uploadedObjectCount !== null)
    || prediction !== (result.uploadedByteLength !== null)
    || (terminal && !prediction && !reconciliation)
    || (terminal && result.disposition !== result.runtimeStatus)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving invocation result lost terminal truth.',
  })
})
export const canonicalSam31VertexServingInvocationResultSchema =
  resultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31VertexServingInvocationResult = z.infer<
  typeof canonicalSam31VertexServingInvocationResultSchema
>

export interface CanonicalSam31VertexServingDeploymentReadPort {
  rereadReadyDeployment(input: {
    readonly endpointDeploymentRef: Ref
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalSam31VertexServingInvocationRepository {
  persistAttemptCreateOnly(input: {
    readonly attempt: CanonicalSam31VertexServingInvocationAttempt
  }): Promise<'created' | 'already_exists'>
  rereadAttempt(input: { readonly invocationId: string }): Promise<unknown>
  persistCallStartCreateOnly(input: {
    readonly callStart: CanonicalSam31VertexServingCallStart
  }): Promise<'created' | 'already_exists'>
  rereadCallStart(input: { readonly invocationId: string }): Promise<unknown>
  persistUnknownCreateOnly(input: {
    readonly result: CanonicalSam31VertexServingInvocationResult
  }): Promise<'created' | 'already_exists'>
  rereadUnknown(input: { readonly invocationId: string }): Promise<unknown>
  persistTerminalCreateOnly(input: {
    readonly result: CanonicalSam31VertexServingInvocationResult
  }): Promise<'created' | 'already_exists'>
  rereadTerminal(input: { readonly invocationId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexServingInvocationService(input: {
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly deploymentReadPort:
    CanonicalSam31VertexServingDeploymentReadPort
  readonly repository: CanonicalSam31VertexServingInvocationRepository
  readonly auth?: Pick<GoogleAuth, 'request'>
  readonly now?: () => string
  readonly timeoutMilliseconds?: number
}) {
  const auth = input.auth ?? new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.timeoutMilliseconds ?? 600_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 900_000) {
    throw new Error('Vertex serving invocation timeout is invalid.')
  }
  return Object.freeze({
    async invokeOne(untrusted: {
      readonly invocationId: string
      readonly dispatchAdmissionDigestSha256: string
      readonly endpointDeploymentRef: Ref
    }): Promise<CanonicalSam31VertexServingInvocationResult> {
      assertPlainSerializedData(untrusted, 'sam31_vertex_serving_invocation')
      const request = z.object({
        invocationId: invocationIdSchema,
        dispatchAdmissionDigestSha256: sha256,
        endpointDeploymentRef: refSchema,
      }).strict().parse(untrusted)
      const invokedAt = timestamp.parse(now())
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(request.invocationId),
      )
      if (
        task.invocationId !== request.invocationId
        || task.runtimeRequest.dispatchAdmissionDigestSha256 !==
          request.dispatchAdmissionDigestSha256
        || task.cloudJobCreated
      ) throw new Error('Vertex invocation task lineage changed.')
      const ready = assertCanonicalSam31VertexServingDeploymentReady(
        await input.deploymentReadPort.rereadReadyDeployment({
          endpointDeploymentRef: request.endpointDeploymentRef,
          at: invokedAt,
        }),
        invokedAt,
      )
      if (!sameRef(ready.endpointDeploymentRef,
        request.endpointDeploymentRef)
        || !sameRef(ready.runtimeReleaseRef, task.runtimeReleaseRef)
        || task.runtimeRequest.dispatch.routeRole !== ready.routeId
        || task.runtimeRequest.dispatch.accelerator !== ready.accelerator
        || task.runtimeRequest.modelArtifacts.immutableImageDigest !==
          ready.immutableImageDigest
      ) {
        throw new Error('Vertex invocation deployment reference changed.')
      }
      const body = {
        instances: [{
          invocationId: request.invocationId,
          dispatchAdmissionDigestSha256:
            request.dispatchAdmissionDigestSha256,
        }],
        parameters: {
          schemaVersion: 'canonical-sam3_1-vertex-prediction-request-v1',
          byteFree: true,
        },
      }
      const candidateAttempt = buildAttempt({
        request,
        task,
        ready,
        body,
        consumedAt: invokedAt,
      })
      const persisted = await input.repository.persistAttemptCreateOnly({
        attempt: candidateAttempt,
      })
      const attempt = assertCanonicalSam31VertexServingInvocationAttempt(
        await input.repository.rereadAttempt({
          invocationId: request.invocationId,
        }),
      )
      if (
        (persisted === 'created'
          && attempt.attemptHash !== candidateAttempt.attemptHash)
        || (persisted === 'already_exists'
          && !sameAttemptLineage(attempt, candidateAttempt))
      ) {
        throw new Error('Vertex invocation attempt exact reread changed.')
      }
      if (persisted === 'already_exists') {
        const reconciled = await reconcileExisting({
          invocationId: request.invocationId,
          attempt,
          task,
          taskStore: input.taskStore,
          repository: input.repository,
          observedAt: invokedAt,
        })
        if (reconciled !== null) return reconciled
      }
      const candidateCallStart = buildCallStart({
        attempt,
        startedAt: timestamp.parse(now()),
      })
      const callStartPersisted =
        await input.repository.persistCallStartCreateOnly({
          callStart: candidateCallStart,
        })
      const callStart = assertCanonicalSam31VertexServingCallStart(
        await input.repository.rereadCallStart({
          invocationId: request.invocationId,
        }),
      )
      if (
        (callStartPersisted === 'created'
          && callStart.callStartHash !== candidateCallStart.callStartHash)
        || (callStartPersisted === 'already_exists'
          && !sameCallStartLineage(callStart, candidateCallStart))
      ) {
        throw new Error('Vertex invocation call-start exact reread changed.')
      }
      if (callStartPersisted === 'already_exists') {
        return persistUnknown({
          attempt,
          callStart,
          repository: input.repository,
          observedAt: timestamp.parse(now()),
        })
      }
      try {
        const response = await auth.request({
          url: PREDICT_URL,
          method: 'POST',
          data: body,
          timeout,
          retry: false,
          maxRedirects: 0,
          responseType: 'json',
          maxContentLength: 2 * 1024 * 1024,
        })
        const prediction = parsePrediction(response.data, request.invocationId)
        return persistTerminalFromPrediction({
          prediction,
          attempt,
          callStart,
          task,
          taskStore: input.taskStore,
          repository: input.repository,
          observedAt: timestamp.parse(now()),
        })
      } catch {
        const observedAt = timestamp.parse(now())
        const response = await input.taskStore.rereadRuntimeResponse(
          request.invocationId,
        )
        if (response !== null) {
          return persistTerminalFromRuntimeResponse({
            runtimeResponse: response,
            attempt,
            callStart,
            task,
            repository: input.repository,
            observedAt,
          })
        }
        return persistUnknown({
          attempt,
          callStart,
          repository: input.repository,
          observedAt,
        })
      }
    },
  })
}

export function createCanonicalSam31VertexServingInvocationRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31VertexServingInvocationRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex serving invocation repository prefix is invalid.')
  }
  const persist = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    value: CanonicalSam31VertexServingInvocationAttempt
      | CanonicalSam31VertexServingCallStart
      | CanonicalSam31VertexServingInvocationResult,
  ) => {
    const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
    const contentSha256 = createHash('sha256').update(body).digest('hex')
    return input.objectPort.createOnly({
      objectPath: path(prefix, value.invocationId, kind),
      body,
      contentSha256,
    })
  }
  const read = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    id: string,
  ) => {
    const body = await input.objectPort.readExact(path(prefix, id, kind))
    if (!body) return null
    const decoded = JSON.parse(body.toString('utf8')) as unknown
    const parsed = kind === 'attempt'
      ? assertCanonicalSam31VertexServingInvocationAttempt(decoded)
      : kind === 'call-start'
        ? assertCanonicalSam31VertexServingCallStart(decoded)
        : assertCanonicalSam31VertexServingInvocationResult(decoded)
    if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
      throw new Error('Vertex invocation repository bytes changed.')
    }
    return structuredClone(parsed)
  }
  return Object.freeze({
    async persistAttemptCreateOnly({ attempt }: {
      readonly attempt: CanonicalSam31VertexServingInvocationAttempt
    }) {
      return persist('attempt',
        assertCanonicalSam31VertexServingInvocationAttempt(attempt))
    },
    async rereadAttempt({ invocationId }: { readonly invocationId: string }) {
      return read('attempt', invocationId)
    },
    async persistCallStartCreateOnly({ callStart }: {
      readonly callStart: CanonicalSam31VertexServingCallStart
    }) {
      return persist('call-start',
        assertCanonicalSam31VertexServingCallStart(callStart))
    },
    async rereadCallStart({ invocationId }: { readonly invocationId: string }) {
      return read('call-start', invocationId)
    },
    async persistUnknownCreateOnly({ result }: {
      readonly result: CanonicalSam31VertexServingInvocationResult
    }) {
      const accepted = assertCanonicalSam31VertexServingInvocationResult(result)
      if (accepted.disposition !==
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Vertex invocation unknown record is terminal.')
      }
      return persist('unknown', accepted)
    },
    async rereadUnknown({ invocationId }: { readonly invocationId: string }) {
      return read('unknown', invocationId)
    },
    async persistTerminalCreateOnly({ result }: {
      readonly result: CanonicalSam31VertexServingInvocationResult
    }) {
      const accepted = assertCanonicalSam31VertexServingInvocationResult(result)
      if (accepted.disposition ===
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Vertex invocation terminal record is unknown.')
      }
      return persist('terminal', accepted)
    },
    async rereadTerminal({ invocationId }: { readonly invocationId: string }) {
      return read('terminal', invocationId)
    },
  })
}

export function createCanonicalGcsSam31VertexServingInvocationRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31VertexServingInvocationRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Vertex invocation repository project changed.')
  }
  return createCanonicalSam31VertexServingInvocationRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

export function assertCanonicalSam31VertexServingDeploymentReady(
  value: unknown,
  at?: string,
): CanonicalSam31VertexServingDeploymentReady {
  assertPlainSerializedData(value, 'sam31_vertex_serving_deployment_ready')
  const parsed = canonicalSam31VertexServingDeploymentReadySchema.parse(value)
  const { readinessHash, ...payload } = parsed
  if (
    readinessHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)
    ))
  ) throw new Error('Vertex serving deployment readiness is invalid.')
  return parsed
}

export function assertCanonicalSam31VertexServingInvocationAttempt(
  value: unknown,
): CanonicalSam31VertexServingInvocationAttempt {
  assertPlainSerializedData(value, 'sam31_vertex_serving_invocation_attempt')
  const parsed = canonicalSam31VertexServingInvocationAttemptSchema.parse(value)
  const { attemptHash, ...payload } = parsed
  if (attemptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving invocation attempt digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingInvocationResult(
  value: unknown,
): CanonicalSam31VertexServingInvocationResult {
  assertPlainSerializedData(value, 'sam31_vertex_serving_invocation_result')
  const parsed = canonicalSam31VertexServingInvocationResultSchema.parse(value)
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving invocation result digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingCallStart(
  value: unknown,
): CanonicalSam31VertexServingCallStart {
  assertPlainSerializedData(value, 'sam31_vertex_serving_call_start')
  const parsed = canonicalSam31VertexServingCallStartSchema.parse(value)
  const { callStartHash, ...payload } = parsed
  if (callStartHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving call-start digest changed.')
  }
  return parsed
}

function buildAttempt(input: {
  request: { invocationId: string; dispatchAdmissionDigestSha256: string;
    endpointDeploymentRef: Ref }
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  ready: CanonicalSam31VertexServingDeploymentReady
  body: unknown
  consumedAt: string
}): CanonicalSam31VertexServingInvocationAttempt {
  const payload = attemptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_INVOCATION_ATTEMPT_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_invocation_owner',
    invocationId: input.request.invocationId,
    endpointDeploymentRef: input.request.endpointDeploymentRef,
    deploymentReadinessRef: {
      id: `sam31-vertex-serving-readiness:${input.request.invocationId}`,
      version: 1,
      contentHash: `sha256:${input.ready.readinessHash}`,
    },
    taskRecordRef: {
      id: input.task.taskId,
      version: 1,
      contentHash: `sha256:${input.task.taskRecordHash}`,
    },
    dispatchAdmissionDigestSha256:
      input.request.dispatchAdmissionDigestSha256,
    requestBodyDigestSha256: sha256AuthorityValue(input.body),
    predictUrlDigestSha256: sha256AuthorityValue({ url: PREDICT_URL }),
    attemptState: 'dispatch_admission_consumed',
    createOnlySingleUseConsumption: true,
    automaticRetryAllowed: false,
    callerEndpointModelStoragePathUrlOrBytesAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    consumedAt: input.consumedAt,
  })
  return canonicalSam31VertexServingInvocationAttemptSchema.parse({
    ...payload,
    attemptHash: sha256AuthorityValue(payload),
  })
}

function buildCallStart(input: {
  attempt: CanonicalSam31VertexServingInvocationAttempt
  startedAt: string
}): CanonicalSam31VertexServingCallStart {
  const payload = callStartWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_SERVING_CALL_START_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_invocation_owner',
    invocationId: input.attempt.invocationId,
    attemptRef: attemptRef(input.attempt),
    requestBodyDigestSha256: input.attempt.requestBodyDigestSha256,
    predictUrlDigestSha256: input.attempt.predictUrlDigestSha256,
    callStartState: 'provider_call_started',
    createOnlyCallStart: true,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    startedAt: input.startedAt,
  })
  return canonicalSam31VertexServingCallStartSchema.parse({
    ...payload,
    callStartHash: sha256AuthorityValue(payload),
  })
}

function parsePrediction(value: unknown, invocationId: string) {
  return z.object({
    predictions: z.array(z.object({
      schemaVersion: z.literal(
        'canonical-sam3_1-vertex-prediction-result-v1',
      ),
      invocationId: z.literal(invocationId),
      runtimeStatus: z.enum(['completed', 'failed']),
      responseRef: refSchema,
      uploadedObjectCount: z.number().int().positive().safe(),
      uploadedByteLength: z.number().int().positive().safe(),
      exactPrivateCreateOnlyPersistence: z.literal(true),
      customerCreditsMutated: z.literal(false),
      qaApproved: z.literal(false),
      productionAuthorityGranted: z.literal(false),
    }).strict()).length(1),
  }).strict().parse(value).predictions[0]!
}

async function reconcileExisting(input: {
  invocationId: string
  attempt: CanonicalSam31VertexServingInvocationAttempt
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31VertexServingInvocationRepository
  observedAt: string
}): Promise<CanonicalSam31VertexServingInvocationResult | null> {
  const terminal = await input.repository.rereadTerminal({
    invocationId: input.invocationId,
  })
  if (terminal !== null) return assertCanonicalSam31VertexServingInvocationResult(
    terminal,
  )
  const response = await input.taskStore.rereadRuntimeResponse(
    input.invocationId,
  )
  if (response !== null) return persistTerminalFromRuntimeResponse({
    runtimeResponse: response,
    attempt: input.attempt,
    callStart: assertCanonicalSam31VertexServingCallStart(
      await input.repository.rereadCallStart({
        invocationId: input.invocationId,
      }),
    ),
    task: input.task,
    repository: input.repository,
    observedAt: input.observedAt,
  })
  const unknown = await input.repository.rereadUnknown({
    invocationId: input.invocationId,
  })
  if (unknown === null) {
    const callStart = await input.repository.rereadCallStart({
      invocationId: input.invocationId,
    })
    if (callStart === null) return null
    return persistUnknown({
      attempt: input.attempt,
      callStart: assertCanonicalSam31VertexServingCallStart(callStart),
      repository: input.repository,
      observedAt: input.observedAt,
    })
  }
  return assertCanonicalSam31VertexServingInvocationResult(unknown)
}

async function persistTerminalFromPrediction(input: {
  prediction: ReturnType<typeof parsePrediction>
  attempt: CanonicalSam31VertexServingInvocationAttempt
  callStart: CanonicalSam31VertexServingCallStart
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31VertexServingInvocationRepository
  observedAt: string
}): Promise<CanonicalSam31VertexServingInvocationResult> {
  const runtime = await input.taskStore.rereadRuntimeResponse(
    input.attempt.invocationId,
  )
  if (runtime === null) {
    throw new Error('Vertex prediction returned before its response reread.')
  }
  const exact = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: runtime,
  })
  const digest = createHash('sha256')
    .update(canonicalSam31GpuWireStringify(exact)).digest('hex')
  if (
    input.prediction.runtimeStatus !== exact.status
    || input.prediction.responseRef.contentHash !== `sha256:${digest}`
  ) throw new Error('Vertex prediction and private response differ.')
  return persistTerminal({
    attempt: input.attempt,
    callStart: input.callStart,
    repository: input.repository,
    runtimeStatus: exact.status,
    runtimeResponseRef: input.prediction.responseRef,
    uploadedObjectCount: input.prediction.uploadedObjectCount,
    uploadedByteLength: input.prediction.uploadedByteLength,
    observedAt: input.observedAt,
  })
}

async function persistTerminalFromRuntimeResponse(input: {
  runtimeResponse: unknown
  attempt: CanonicalSam31VertexServingInvocationAttempt
  callStart: CanonicalSam31VertexServingCallStart
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  repository: CanonicalSam31VertexServingInvocationRepository
  observedAt: string
}): Promise<CanonicalSam31VertexServingInvocationResult> {
  const exact = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: input.runtimeResponse,
  })
  const bytes = Buffer.from(canonicalSam31GpuWireStringify(exact), 'utf8')
  return persistTerminal({
    attempt: input.attempt,
    callStart: input.callStart,
    repository: input.repository,
    runtimeStatus: exact.status,
    runtimeResponseRef: {
      id: `sam31-gpu-response:${input.attempt.invocationId}`,
      version: 1,
      contentHash: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    },
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'private_response_reconciliation',
    observedAt: input.observedAt,
  })
}

async function persistTerminal(input: {
  attempt: CanonicalSam31VertexServingInvocationAttempt
  callStart: CanonicalSam31VertexServingCallStart
  repository: CanonicalSam31VertexServingInvocationRepository
  runtimeStatus: 'completed' | 'failed'
  runtimeResponseRef: Ref
  uploadedObjectCount: number | null
  uploadedByteLength: number | null
  terminalEvidenceMode?: 'provider_prediction_and_private_response' |
    'private_response_reconciliation'
  observedAt: string
}): Promise<CanonicalSam31VertexServingInvocationResult> {
  const terminal = buildResult({
    attempt: input.attempt,
    callStart: input.callStart,
    disposition: input.runtimeStatus,
    runtimeStatus: input.runtimeStatus,
    runtimeResponseRef: input.runtimeResponseRef,
    uploadedObjectCount: input.uploadedObjectCount,
    uploadedByteLength: input.uploadedByteLength,
    terminalEvidenceMode: input.terminalEvidenceMode ??
      'provider_prediction_and_private_response',
    providerOutcome: 'executed',
    exactPrivateRuntimeResponseReread: true,
    unresolvedOutcomeBlocksRetry: false,
    observedAt: input.observedAt,
  })
  await input.repository.persistTerminalCreateOnly({ result: terminal })
  return assertExactRepositoryResult({
    expected: terminal,
    untrusted: await input.repository.rereadTerminal({
      invocationId: input.attempt.invocationId,
    }),
  })
}

async function persistUnknown(input: {
  attempt: CanonicalSam31VertexServingInvocationAttempt
  callStart: CanonicalSam31VertexServingCallStart
  repository: CanonicalSam31VertexServingInvocationRepository
  observedAt: string
}): Promise<CanonicalSam31VertexServingInvocationResult> {
  const unknown = buildResult({
    attempt: input.attempt,
    callStart: input.callStart,
    disposition: 'outcome_unknown_requires_reconciliation',
    runtimeStatus: null,
    runtimeResponseRef: null,
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'none_unknown',
    providerOutcome: 'unknown',
    exactPrivateRuntimeResponseReread: false,
    unresolvedOutcomeBlocksRetry: true,
    observedAt: input.observedAt,
  })
  await input.repository.persistUnknownCreateOnly({ result: unknown })
  return assertExactRepositoryResult({
    expected: unknown,
    untrusted: await input.repository.rereadUnknown({
      invocationId: input.attempt.invocationId,
    }),
  })
}

function buildResult(input: {
  attempt: CanonicalSam31VertexServingInvocationAttempt
  callStart: CanonicalSam31VertexServingCallStart
  disposition: 'completed' | 'failed' |
    'outcome_unknown_requires_reconciliation'
  runtimeStatus: 'completed' | 'failed' | null
  runtimeResponseRef: Ref | null
  uploadedObjectCount: number | null
  uploadedByteLength: number | null
  terminalEvidenceMode: 'provider_prediction_and_private_response' |
    'private_response_reconciliation' | 'none_unknown'
  providerOutcome: 'executed' | 'unknown'
  exactPrivateRuntimeResponseReread: boolean
  unresolvedOutcomeBlocksRetry: boolean
  observedAt: string
}): CanonicalSam31VertexServingInvocationResult {
  const payload = resultWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_INVOCATION_RESULT_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_invocation_owner',
    invocationId: input.attempt.invocationId,
    attemptRef: attemptRef(input.attempt),
    callStartRef: {
      id: `sam31-vertex-serving-call-start:${input.attempt.invocationId}`,
      version: 1,
      contentHash: `sha256:${input.callStart.callStartHash}`,
    },
    disposition: input.disposition,
    runtimeStatus: input.runtimeStatus,
    runtimeResponseRef: input.runtimeResponseRef,
    uploadedObjectCount: input.uploadedObjectCount,
    uploadedByteLength: input.uploadedByteLength,
    terminalEvidenceMode: input.terminalEvidenceMode,
    providerCallStarted: true,
    providerOutcome: input.providerOutcome,
    exactPrivateRuntimeResponseReread:
      input.exactPrivateRuntimeResponseReread,
    automaticRetryAllowed: false,
    unresolvedOutcomeBlocksRetry: input.unresolvedOutcomeBlocksRetry,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31VertexServingInvocationResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function assertExactRepositoryResult(input: {
  expected: CanonicalSam31VertexServingInvocationResult
  untrusted: unknown
}): CanonicalSam31VertexServingInvocationResult {
  const reread = assertCanonicalSam31VertexServingInvocationResult(
    input.untrusted,
  )
  if (reread.resultHash !== input.expected.resultHash) {
    throw new Error('Vertex invocation result exact reread changed.')
  }
  return reread
}

function path(prefix: string, invocationId: string,
  kind: 'attempt' | 'call-start' | 'unknown' | 'terminal'): string {
  return `${prefix}/${invocationIdSchema.parse(invocationId)}/${kind}.json`
}

function attemptRef(
  attempt: CanonicalSam31VertexServingInvocationAttempt,
): Ref {
  return {
    id: `sam31-vertex-serving-attempt:${attempt.invocationId}`,
    version: 1,
    contentHash: `sha256:${attempt.attemptHash}`,
  }
}

function sameRef(left: Ref, right: Ref): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameAttemptLineage(
  left: CanonicalSam31VertexServingInvocationAttempt,
  right: CanonicalSam31VertexServingInvocationAttempt,
): boolean {
  return stableAuthorityStringify(withoutTemporalFields(left, [
    'attemptHash',
    'consumedAt',
  ])) === stableAuthorityStringify(withoutTemporalFields(right, [
    'attemptHash',
    'consumedAt',
  ]))
}

function sameCallStartLineage(
  left: CanonicalSam31VertexServingCallStart,
  right: CanonicalSam31VertexServingCallStart,
): boolean {
  return stableAuthorityStringify(withoutTemporalFields(left, [
    'callStartHash',
    'startedAt',
  ])) === stableAuthorityStringify(withoutTemporalFields(right, [
    'callStartHash',
    'startedAt',
  ]))
}

function withoutTemporalFields(
  value: Readonly<Record<string, unknown>>,
  omitted: readonly string[],
): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(value).filter(([key]) => !omitted.includes(key)),
  ))
}
