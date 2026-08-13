import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31CurrentA100CustomerDispatchAllowed,
  type CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  canonicalSam31VertexDedicatedPredictionRouteRef,
  rereadCanonicalSam31VertexDedicatedPredictionRoute,
} from './canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  isCanonicalSam31VertexScaleZeroDroppedBeforeInference429,
} from './canonical-sam3_1-vertex-serving-readiness-probe-service'
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
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_INVOCATION_ATTEMPT_VERSION =
  'canonical-sam3_1-current-vertex-customer-invocation-attempt-v1' as const
export const CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_CALL_START_VERSION =
  'canonical-sam3_1-current-vertex-customer-call-start-v1' as const
export const CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_INVOCATION_RESULT_VERSION =
  'canonical-sam3_1-current-vertex-customer-invocation-result-v1' as const

const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v2/sam3_1-current-vertex-customer-invocations'
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

const attemptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_INVOCATION_ATTEMPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_current_vertex_customer_invocation_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: invocationIdSchema,
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  routeId: z.literal('a100_80gb_heavy_primary'),
  endpointResourceName: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  ),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  ),
  modelVersionId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  ),
  currentCustomerDispatchReadinessRef: refSchema,
  currentEndpointRouteRef: refSchema.extend({ version: z.literal(2) }).strict(),
  endpointCapacityObservationRef: refSchema,
  a100ServingQuotaObservationRef: refSchema,
  runtimeReleaseRef: refSchema,
  rateAuthorityRef: refSchema,
  taskRecordRef: refSchema,
  executionAttemptRef: refSchema,
  fundedReservationRef: refSchema,
  dispatchAdmissionDigestSha256: sha256,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  attemptState: z.literal(
    'funded_dispatch_admission_consumed_before_current_endpoint_call',
  ),
  createOnlySingleUseConsumption: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  callerEndpointModelStoragePathUrlBytesOrPriceAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  consumedAt: timestamp,
}).strict()
export const canonicalSam31CurrentVertexCustomerInvocationAttemptSchema =
  attemptWithoutHashSchema.extend({ attemptHash: sha256 }).strict()
export type CanonicalSam31CurrentVertexCustomerInvocationAttempt = z.infer<
  typeof canonicalSam31CurrentVertexCustomerInvocationAttemptSchema
>

const callStartWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_CALL_START_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_current_vertex_customer_invocation_owner',
  ),
  invocationId: invocationIdSchema,
  attemptRef: refSchema,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  callStartState: z.literal('current_vertex_provider_call_started'),
  createOnlyCallStart: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
}).strict()
export const canonicalSam31CurrentVertexCustomerCallStartSchema =
  callStartWithoutHashSchema.extend({ callStartHash: sha256 }).strict()
export type CanonicalSam31CurrentVertexCustomerCallStart = z.infer<
  typeof canonicalSam31CurrentVertexCustomerCallStartSchema
>

const resultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_INVOCATION_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_current_vertex_customer_invocation_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_response_reread'),
  invocationId: invocationIdSchema,
  attemptRef: refSchema,
  callStartRef: refSchema,
  executionAttemptRef: refSchema,
  disposition: z.enum([
    'completed',
    'failed',
    'not_executed_scale_from_zero_trigger',
    'outcome_unknown_requires_reconciliation',
  ]),
  runtimeStatus: z.enum(['completed', 'failed']).nullable(),
  runtimeResponseRef: refSchema.nullable(),
  uploadedObjectCount: z.number().int().positive().safe().nullable(),
  uploadedByteLength: z.number().int().positive().safe().nullable(),
  terminalEvidenceMode: z.enum([
    'provider_prediction_and_private_response',
    'private_response_reconciliation',
    'vertex_scale_zero_429_before_inference',
    'none_unknown',
  ]),
  providerCallStarted: z.literal(true),
  providerOutcome: z.enum(['executed', 'not_executed', 'unknown']),
  providerRoundTripDurationMilliseconds:
    z.number().int().nonnegative().safe().nullable(),
  exactPrivateRuntimeResponseReread: z.boolean(),
  exactVertexPredictionWrapperReread: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation: z.boolean(),
  unresolvedOutcomeBlocksRetry: z.boolean(),
  canonicalServingWindowUsageCostAndCreditSettlementPending: z.literal(true),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const unknown = result.disposition ===
    'outcome_unknown_requires_reconciliation'
  const notExecuted = result.disposition ===
    'not_executed_scale_from_zero_trigger'
  const executedTerminal = !unknown && !notExecuted
  const prediction = result.terminalEvidenceMode ===
    'provider_prediction_and_private_response'
  const reconciliation = result.terminalEvidenceMode ===
    'private_response_reconciliation'
  const scaleZero = result.terminalEvidenceMode ===
    'vertex_scale_zero_429_before_inference'
  const exact = unknown === (result.providerOutcome === 'unknown')
    && notExecuted === (result.providerOutcome === 'not_executed')
    && unknown === result.unresolvedOutcomeBlocksRetry
    && notExecuted ===
      result.knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation
    && unknown === (result.terminalEvidenceMode === 'none_unknown')
    && notExecuted === scaleZero
    && executedTerminal === result.exactPrivateRuntimeResponseReread
    && prediction === result.exactVertexPredictionWrapperReread
    && executedTerminal === (result.runtimeStatus !== null)
    && executedTerminal === (result.runtimeResponseRef !== null)
    && prediction === (result.uploadedObjectCount !== null)
    && prediction === (result.uploadedByteLength !== null)
    && (prediction || scaleZero) ===
      (result.providerRoundTripDurationMilliseconds !== null)
    && (!executedTerminal || prediction || reconciliation)
    && (!executedTerminal || result.disposition === result.runtimeStatus)
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Current Vertex customer invocation lost terminal truth.',
  })
})
export const canonicalSam31CurrentVertexCustomerInvocationResultSchema =
  resultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31CurrentVertexCustomerInvocationResult = z.infer<
  typeof canonicalSam31CurrentVertexCustomerInvocationResultSchema
>

export interface CanonicalSam31CurrentVertexCustomerInvocationRepository {
  persistAttemptCreateOnly(input: {
    readonly attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  }): Promise<'created' | 'already_exists'>
  rereadAttempt(input: { readonly invocationId: string }): Promise<unknown>
  persistCallStartCreateOnly(input: {
    readonly callStart: CanonicalSam31CurrentVertexCustomerCallStart
  }): Promise<'created' | 'already_exists'>
  rereadCallStart(input: { readonly invocationId: string }): Promise<unknown>
  persistUnknownCreateOnly(input: {
    readonly result: CanonicalSam31CurrentVertexCustomerInvocationResult
  }): Promise<'created' | 'already_exists'>
  rereadUnknown(input: { readonly invocationId: string }): Promise<unknown>
  persistTerminalCreateOnly(input: {
    readonly result: CanonicalSam31CurrentVertexCustomerInvocationResult
  }): Promise<'created' | 'already_exists'>
  rereadTerminal(input: { readonly invocationId: string }): Promise<unknown>
}

export interface CanonicalSam31CurrentVertexCustomerInvocationPort {
  invokeOne(input: {
    readonly invocationId: string
    readonly dispatchAdmissionDigestSha256: string
  }): Promise<CanonicalSam31CurrentVertexCustomerInvocationResult>
}

export function createCanonicalSam31CurrentVertexCustomerInvocationService(
  input: {
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly currentReadinessReadPort:
      CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
    readonly repository:
      CanonicalSam31CurrentVertexCustomerInvocationRepository
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly now?: () => string
    readonly clockMilliseconds?: () => number
    readonly timeoutMilliseconds?: number
  },
): CanonicalSam31CurrentVertexCustomerInvocationPort {
  const auth = input.auth ?? new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const clock = input.clockMilliseconds ?? (() => Date.now())
  const timeout = input.timeoutMilliseconds ?? 600_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 600_000) {
    throw new Error('Current Vertex customer invocation timeout changed.')
  }
  return Object.freeze({
    async invokeOne(untrusted: unknown): Promise<
      CanonicalSam31CurrentVertexCustomerInvocationResult
    > {
      assertPlainSerializedData(untrusted,
        'sam31_current_vertex_customer_invocation')
      const request = z.object({
        invocationId: invocationIdSchema,
        dispatchAdmissionDigestSha256: sha256,
      }).strict().parse(untrusted)
      const invokedAt = timestamp.parse(now())
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(request.invocationId),
      )
      assertTaskLineage(request, task)
      const readiness = assertCanonicalSam31CurrentA100CustomerDispatchAllowed({
        readiness: await input.currentReadinessReadPort.rereadCurrent({
          toolId: 'sam3_1',
          operationId: CANONICAL_SAM3_1_OPERATION_ID,
          runtimeReleaseRef: task.runtimeReleaseRef,
          rateAuthorityRef: task.primaryRateAuthorityRef,
          at: invokedAt,
        }),
        runtimeReleaseRef: task.runtimeReleaseRef,
        rateAuthorityRef: task.primaryRateAuthorityRef,
        immutableImageDigest:
          task.runtimeRequest.modelArtifacts.immutableImageDigest,
        at: invokedAt,
      })
      const route = await rereadCanonicalSam31VertexDedicatedPredictionRoute({
        auth,
        timeoutMilliseconds: Math.min(timeout, 60_000),
      })
      const routeRef = canonicalSam31VertexDedicatedPredictionRouteRef(route)
      if (!sameRef(readiness.endpointRouteRef, routeRef)
        || readiness.endpointResourceName !== route.endpointResourceName
        || readiness.deployedModelId !== route.deployedModelId) {
        throw new Error('Current A100 readiness and live endpoint route differ.')
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
      const priorAttemptRaw = await input.repository.rereadAttempt({
        invocationId: request.invocationId,
      })
      const priorAttempt = priorAttemptRaw === null ? null
        : assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(
          priorAttemptRaw,
        )
      const candidateAttempt = buildAttempt({
        request,
        task,
        readiness,
        routeRef,
        body,
        predictUrl: route.predictUrl,
        consumedAt: priorAttempt?.consumedAt ?? invokedAt,
      })
      const attemptDisposition = priorAttempt === null
        ? await input.repository.persistAttemptCreateOnly({
          attempt: candidateAttempt,
        })
        : 'already_exists' as const
      const attempt = priorAttempt ??
        assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(
          await input.repository.rereadAttempt({
            invocationId: request.invocationId,
          }),
        )
      if (attemptDisposition === 'created'
        ? attempt.attemptHash !== candidateAttempt.attemptHash
        : !sameAttemptLineage(attempt, candidateAttempt)) {
        throw new Error('Current Vertex attempt exact reread changed.')
      }
      if (attemptDisposition === 'already_exists') {
        const existing = await reconcileExisting({
          attempt,
          task,
          taskStore: input.taskStore,
          repository: input.repository,
          observedAt: invokedAt,
        })
        if (existing !== null) return existing
      }
      const candidateCallStart = buildCallStart({
        attempt,
        startedAt: timestamp.parse(now()),
      })
      const callStartDisposition =
        await input.repository.persistCallStartCreateOnly({
          callStart: candidateCallStart,
        })
      const callStart = assertCanonicalSam31CurrentVertexCustomerCallStart(
        await input.repository.rereadCallStart({
          invocationId: request.invocationId,
        }),
      )
      if (callStartDisposition === 'created'
        ? callStart.callStartHash !== candidateCallStart.callStartHash
        : !sameCallStartLineage(callStart, candidateCallStart)) {
        throw new Error('Current Vertex call-start exact reread changed.')
      }
      if (callStartDisposition === 'already_exists') {
        return persistUnknown({
          attempt,
          callStart,
          repository: input.repository,
          observedAt: timestamp.parse(now()),
        })
      }
      const startedClock = clock()
      try {
        const response = await auth.request({
          url: route.predictUrl,
          method: 'POST',
          data: body,
          timeout,
          retry: false,
          maxRedirects: 0,
          responseType: 'json',
          maxContentLength: 2 * 1024 * 1024,
        })
        const elapsed = elapsedMilliseconds(startedClock, clock())
        const prediction = parsePrediction(response.data, request.invocationId)
        return persistTerminalFromPrediction({
          prediction,
          attempt,
          callStart,
          task,
          taskStore: input.taskStore,
          repository: input.repository,
          providerRoundTripDurationMilliseconds: elapsed,
          observedAt: timestamp.parse(now()),
        })
      } catch (error) {
        const elapsed = elapsedMilliseconds(startedClock, clock())
        const observedAt = timestamp.parse(now())
        const runtimeResponse = await input.taskStore.rereadRuntimeResponse(
          request.invocationId,
        )
        if (runtimeResponse !== null) {
          return persistTerminalFromRuntimeResponse({
            runtimeResponse,
            attempt,
            callStart,
            task,
            repository: input.repository,
            observedAt,
          })
        }
        if (isCanonicalSam31VertexScaleZeroDroppedBeforeInference429(error)) {
          return persistScaleZeroNotExecuted({
            attempt,
            callStart,
            repository: input.repository,
            providerRoundTripDurationMilliseconds: elapsed,
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

export function createCanonicalSam31CurrentVertexCustomerInvocationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31CurrentVertexCustomerInvocationRepository {
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const persist = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    value: CanonicalSam31CurrentVertexCustomerInvocationAttempt
      | CanonicalSam31CurrentVertexCustomerCallStart
      | CanonicalSam31CurrentVertexCustomerInvocationResult,
  ) => {
    const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
    return input.objectPort.createOnly({
      objectPath: recordPath(prefix, value.invocationId, kind),
      body,
      contentSha256: createHash('sha256').update(body).digest('hex'),
    })
  }
  const read = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    invocationId: string,
  ) => {
    const body = await input.objectPort.readExact(
      recordPath(prefix, invocationId, kind),
    )
    if (!body) return null
    const decoded = JSON.parse(body.toString('utf8')) as unknown
    const parsed = kind === 'attempt'
      ? assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(decoded)
      : kind === 'call-start'
        ? assertCanonicalSam31CurrentVertexCustomerCallStart(decoded)
        : assertCanonicalSam31CurrentVertexCustomerInvocationResult(decoded)
    if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
      throw new Error('Current Vertex invocation bytes changed.')
    }
    return structuredClone(parsed)
  }
  const repository: CanonicalSam31CurrentVertexCustomerInvocationRepository = {
    persistAttemptCreateOnly: ({ attempt }) => persist('attempt',
      assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(attempt)),
    rereadAttempt: ({ invocationId }) => read('attempt', invocationId),
    persistCallStartCreateOnly: ({ callStart }) => persist('call-start',
      assertCanonicalSam31CurrentVertexCustomerCallStart(callStart)),
    rereadCallStart: ({ invocationId }) => read('call-start', invocationId),
    persistUnknownCreateOnly: ({ result }) => {
      const parsed = assertCanonicalSam31CurrentVertexCustomerInvocationResult(
        result,
      )
      if (parsed.disposition !==
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Current Vertex unknown record is terminal.')
      }
      return persist('unknown', parsed)
    },
    rereadUnknown: ({ invocationId }) => read('unknown', invocationId),
    persistTerminalCreateOnly: ({ result }) => {
      const parsed = assertCanonicalSam31CurrentVertexCustomerInvocationResult(
        result,
      )
      if (parsed.disposition ===
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Current Vertex terminal record is unknown.')
      }
      return persist('terminal', parsed)
    },
    rereadTerminal: ({ invocationId }) => read('terminal', invocationId),
  }
  return Object.freeze(repository)
}

export function createCanonicalGcpSam31CurrentVertexCustomerInvocationService(
  input: {
    readonly currentReadinessReadPort:
      CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
    readonly storage?: Storage
    readonly auth?: Pick<GoogleAuth, 'request'>
  },
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: STATE_BUCKET,
  })
  return createCanonicalSam31CurrentVertexCustomerInvocationService({
    taskStore: createCanonicalSam31GpuTaskStoreFromObjectPort({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: 'reeditpro-production-reeditpro-masks',
      }),
      prefix: TASK_PREFIX,
    }),
    currentReadinessReadPort: input.currentReadinessReadPort,
    repository:
      createCanonicalSam31CurrentVertexCustomerInvocationRepository({
        objectPort,
      }),
    auth: input.auth,
  })
}

export function assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(
  value: unknown,
): CanonicalSam31CurrentVertexCustomerInvocationAttempt {
  assertPlainSerializedData(value, 'sam31_current_vertex_customer_attempt')
  const parsed = canonicalSam31CurrentVertexCustomerInvocationAttemptSchema
    .parse(value)
  const { attemptHash, ...payload } = parsed
  if (attemptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Current Vertex customer attempt digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31CurrentVertexCustomerCallStart(
  value: unknown,
): CanonicalSam31CurrentVertexCustomerCallStart {
  assertPlainSerializedData(value, 'sam31_current_vertex_customer_call_start')
  const parsed = canonicalSam31CurrentVertexCustomerCallStartSchema.parse(
    value,
  )
  const { callStartHash, ...payload } = parsed
  if (callStartHash !== sha256AuthorityValue(payload)) {
    throw new Error('Current Vertex customer call-start digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31CurrentVertexCustomerInvocationResult(
  value: unknown,
): CanonicalSam31CurrentVertexCustomerInvocationResult {
  assertPlainSerializedData(value, 'sam31_current_vertex_customer_result')
  const parsed = canonicalSam31CurrentVertexCustomerInvocationResultSchema
    .parse(value)
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new Error('Current Vertex customer result digest changed.')
  }
  return parsed
}

function assertTaskLineage(
  request: { invocationId: string; dispatchAdmissionDigestSha256: string },
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>,
): void {
  const exact = task.invocationId === request.invocationId
    && task.runtimeRequest.operationId === CANONICAL_SAM3_1_OPERATION_ID
    && task.runtimeRequest.dispatchAdmissionDigestSha256 ===
      request.dispatchAdmissionDigestSha256
    && task.runtimeRequest.dispatch.routeRole === 'a100_80gb_heavy_primary'
    && task.runtimeRequest.dispatch.accelerator === 'nvidia_a100_80gb'
    && task.runtimeRequest.dispatch.attemptOrdinal === 1
    && task.runtimeRequest.dispatch.userTriggeredAfterApproval
    && task.runtimeRequest.dispatch.scaleFromZeroRequired
    && !task.cloudJobCreated
  if (!exact) throw new Error('Current Vertex customer task lineage changed.')
}

function buildAttempt(input: {
  request: { invocationId: string; dispatchAdmissionDigestSha256: string }
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  readiness: ReturnType<
    typeof assertCanonicalSam31CurrentA100CustomerDispatchAllowed
  >
  routeRef: Ref
  body: unknown
  predictUrl: string
  consumedAt: string
}): CanonicalSam31CurrentVertexCustomerInvocationAttempt {
  const payload = attemptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_INVOCATION_ATTEMPT_VERSION,
    source: 'canonical_server_sam31_current_vertex_customer_invocation_owner',
    evidenceClass: 'canonical_private_reread',
    invocationId: input.request.invocationId,
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    routeId: 'a100_80gb_heavy_primary',
    endpointResourceName: CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
    deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
    modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
    currentCustomerDispatchReadinessRef: ref(
      input.readiness.readinessId,
      input.readiness.readinessHash,
    ),
    currentEndpointRouteRef: input.routeRef,
    endpointCapacityObservationRef:
      input.readiness.endpointCapacityObservationRef,
    a100ServingQuotaObservationRef:
      input.readiness.a100ServingQuotaObservationRef,
    runtimeReleaseRef: input.task.runtimeReleaseRef,
    rateAuthorityRef: input.task.primaryRateAuthorityRef,
    taskRecordRef: ref(input.task.taskId, input.task.taskRecordHash),
    executionAttemptRef:
      input.task.runtimeRequest.scope.executionAttemptRef,
    fundedReservationRef:
      input.task.runtimeRequest.scope.fundedCreditReservationRef,
    dispatchAdmissionDigestSha256:
      input.request.dispatchAdmissionDigestSha256,
    requestBodyDigestSha256: sha256AuthorityValue(input.body),
    predictUrlDigestSha256: sha256AuthorityValue({ url: input.predictUrl }),
    attemptState:
      'funded_dispatch_admission_consumed_before_current_endpoint_call',
    createOnlySingleUseConsumption: true,
    automaticRetryAllowed: false,
    callerEndpointModelStoragePathUrlBytesOrPriceAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    consumedAt: input.consumedAt,
  })
  return canonicalSam31CurrentVertexCustomerInvocationAttemptSchema.parse({
    ...payload,
    attemptHash: sha256AuthorityValue(payload),
  })
}

function buildCallStart(input: {
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  startedAt: string
}): CanonicalSam31CurrentVertexCustomerCallStart {
  const payload = callStartWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_CALL_START_VERSION,
    source: 'canonical_server_sam31_current_vertex_customer_invocation_owner',
    invocationId: input.attempt.invocationId,
    attemptRef: attemptRef(input.attempt),
    requestBodyDigestSha256: input.attempt.requestBodyDigestSha256,
    predictUrlDigestSha256: input.attempt.predictUrlDigestSha256,
    callStartState: 'current_vertex_provider_call_started',
    createOnlyCallStart: true,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    startedAt: input.startedAt,
  })
  return canonicalSam31CurrentVertexCustomerCallStartSchema.parse({
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
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  observedAt: string
}): Promise<CanonicalSam31CurrentVertexCustomerInvocationResult | null> {
  const terminal = await input.repository.rereadTerminal({
    invocationId: input.attempt.invocationId,
  })
  if (terminal !== null) {
    return assertCanonicalSam31CurrentVertexCustomerInvocationResult(terminal)
  }
  const runtimeResponse = await input.taskStore.rereadRuntimeResponse(
    input.attempt.invocationId,
  )
  const callStartRaw = await input.repository.rereadCallStart({
    invocationId: input.attempt.invocationId,
  })
  if (runtimeResponse !== null) {
    if (callStartRaw === null) {
      throw new Error('Runtime response exists before provider call-start.')
    }
    return persistTerminalFromRuntimeResponse({
      runtimeResponse,
      attempt: input.attempt,
      callStart:
        assertCanonicalSam31CurrentVertexCustomerCallStart(callStartRaw),
      task: input.task,
      repository: input.repository,
      observedAt: input.observedAt,
    })
  }
  const unknown = await input.repository.rereadUnknown({
    invocationId: input.attempt.invocationId,
  })
  if (unknown !== null) {
    return assertCanonicalSam31CurrentVertexCustomerInvocationResult(unknown)
  }
  if (callStartRaw === null) return null
  return persistUnknown({
    attempt: input.attempt,
    callStart: assertCanonicalSam31CurrentVertexCustomerCallStart(callStartRaw),
    repository: input.repository,
    observedAt: input.observedAt,
  })
}

async function persistTerminalFromPrediction(input: {
  prediction: ReturnType<typeof parsePrediction>
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  callStart: CanonicalSam31CurrentVertexCustomerCallStart
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  providerRoundTripDurationMilliseconds: number
  observedAt: string
}) {
  const runtimeRaw = await input.taskStore.rereadRuntimeResponse(
    input.attempt.invocationId,
  )
  if (runtimeRaw === null) {
    throw new Error('Vertex prediction returned before response persistence.')
  }
  const runtime = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: runtimeRaw,
  })
  const digest = createHash('sha256')
    .update(canonicalSam31GpuWireStringify(runtime)).digest('hex')
  if (input.prediction.runtimeStatus !== runtime.status
    || input.prediction.responseRef.contentHash !== `sha256:${digest}`) {
    throw new Error('Current Vertex prediction and response differ.')
  }
  return persistTerminal({
    attempt: input.attempt,
    callStart: input.callStart,
    repository: input.repository,
    runtimeStatus: runtime.status,
    runtimeResponseRef: input.prediction.responseRef,
    uploadedObjectCount: input.prediction.uploadedObjectCount,
    uploadedByteLength: input.prediction.uploadedByteLength,
    terminalEvidenceMode: 'provider_prediction_and_private_response',
    providerRoundTripDurationMilliseconds:
      input.providerRoundTripDurationMilliseconds,
    observedAt: input.observedAt,
  })
}

async function persistTerminalFromRuntimeResponse(input: {
  runtimeResponse: unknown
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  callStart: CanonicalSam31CurrentVertexCustomerCallStart
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  observedAt: string
}) {
  const runtime = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: input.runtimeResponse,
  })
  const bytes = Buffer.from(canonicalSam31GpuWireStringify(runtime), 'utf8')
  return persistTerminal({
    attempt: input.attempt,
    callStart: input.callStart,
    repository: input.repository,
    runtimeStatus: runtime.status,
    runtimeResponseRef: ref(
      `sam31-gpu-response:${input.attempt.invocationId}`,
      createHash('sha256').update(bytes).digest('hex'),
    ),
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'private_response_reconciliation',
    providerRoundTripDurationMilliseconds: null,
    observedAt: input.observedAt,
  })
}

async function persistTerminal(input: {
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  callStart: CanonicalSam31CurrentVertexCustomerCallStart
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  runtimeStatus: 'completed' | 'failed'
  runtimeResponseRef: Ref
  uploadedObjectCount: number | null
  uploadedByteLength: number | null
  terminalEvidenceMode: 'provider_prediction_and_private_response' |
    'private_response_reconciliation'
  providerRoundTripDurationMilliseconds: number | null
  observedAt: string
}) {
  const result = buildResult({
    attempt: input.attempt,
    callStart: input.callStart,
    disposition: input.runtimeStatus,
    runtimeStatus: input.runtimeStatus,
    runtimeResponseRef: input.runtimeResponseRef,
    uploadedObjectCount: input.uploadedObjectCount,
    uploadedByteLength: input.uploadedByteLength,
    terminalEvidenceMode: input.terminalEvidenceMode,
    providerOutcome: 'executed',
    providerRoundTripDurationMilliseconds:
      input.providerRoundTripDurationMilliseconds,
    exactPrivateRuntimeResponseReread: true,
    exactVertexPredictionWrapperReread:
      input.terminalEvidenceMode ===
      'provider_prediction_and_private_response',
    knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation: false,
    unresolvedOutcomeBlocksRetry: false,
    observedAt: input.observedAt,
  })
  await input.repository.persistTerminalCreateOnly({ result })
  return assertExactRepositoryResult({
    expected: result,
    untrusted: await input.repository.rereadTerminal({
      invocationId: input.attempt.invocationId,
    }),
  })
}

async function persistScaleZeroNotExecuted(input: {
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  callStart: CanonicalSam31CurrentVertexCustomerCallStart
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  providerRoundTripDurationMilliseconds: number
  observedAt: string
}) {
  const result = buildResult({
    attempt: input.attempt,
    callStart: input.callStart,
    disposition: 'not_executed_scale_from_zero_trigger',
    runtimeStatus: null,
    runtimeResponseRef: null,
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'vertex_scale_zero_429_before_inference',
    providerOutcome: 'not_executed',
    providerRoundTripDurationMilliseconds:
      input.providerRoundTripDurationMilliseconds,
    exactPrivateRuntimeResponseReread: false,
    exactVertexPredictionWrapperReread: false,
    knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation: true,
    unresolvedOutcomeBlocksRetry: false,
    observedAt: input.observedAt,
  })
  await input.repository.persistTerminalCreateOnly({ result })
  return assertExactRepositoryResult({
    expected: result,
    untrusted: await input.repository.rereadTerminal({
      invocationId: input.attempt.invocationId,
    }),
  })
}

async function persistUnknown(input: {
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  callStart: CanonicalSam31CurrentVertexCustomerCallStart
  repository: CanonicalSam31CurrentVertexCustomerInvocationRepository
  observedAt: string
}) {
  const result = buildResult({
    attempt: input.attempt,
    callStart: input.callStart,
    disposition: 'outcome_unknown_requires_reconciliation',
    runtimeStatus: null,
    runtimeResponseRef: null,
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'none_unknown',
    providerOutcome: 'unknown',
    providerRoundTripDurationMilliseconds: null,
    exactPrivateRuntimeResponseReread: false,
    exactVertexPredictionWrapperReread: false,
    knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation: false,
    unresolvedOutcomeBlocksRetry: true,
    observedAt: input.observedAt,
  })
  await input.repository.persistUnknownCreateOnly({ result })
  return assertExactRepositoryResult({
    expected: result,
    untrusted: await input.repository.rereadUnknown({
      invocationId: input.attempt.invocationId,
    }),
  })
}

function buildResult(input: {
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt
  callStart: CanonicalSam31CurrentVertexCustomerCallStart
  disposition: 'completed' | 'failed' |
    'not_executed_scale_from_zero_trigger' |
    'outcome_unknown_requires_reconciliation'
  runtimeStatus: 'completed' | 'failed' | null
  runtimeResponseRef: Ref | null
  uploadedObjectCount: number | null
  uploadedByteLength: number | null
  terminalEvidenceMode: 'provider_prediction_and_private_response' |
    'private_response_reconciliation' |
    'vertex_scale_zero_429_before_inference' | 'none_unknown'
  providerOutcome: 'executed' | 'not_executed' | 'unknown'
  providerRoundTripDurationMilliseconds: number | null
  exactPrivateRuntimeResponseReread: boolean
  exactVertexPredictionWrapperReread: boolean
  knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation: boolean
  unresolvedOutcomeBlocksRetry: boolean
  observedAt: string
}) {
  const payload = resultWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_CURRENT_VERTEX_CUSTOMER_INVOCATION_RESULT_VERSION,
    source: 'canonical_server_sam31_current_vertex_customer_invocation_owner',
    evidenceClass: 'canonical_private_exact_response_reread',
    invocationId: input.attempt.invocationId,
    attemptRef: attemptRef(input.attempt),
    callStartRef: ref(
      `sam31-current-vertex-call-start:${input.attempt.invocationId}`,
      input.callStart.callStartHash,
    ),
    executionAttemptRef: input.attempt.executionAttemptRef,
    disposition: input.disposition,
    runtimeStatus: input.runtimeStatus,
    runtimeResponseRef: input.runtimeResponseRef,
    uploadedObjectCount: input.uploadedObjectCount,
    uploadedByteLength: input.uploadedByteLength,
    terminalEvidenceMode: input.terminalEvidenceMode,
    providerCallStarted: true,
    providerOutcome: input.providerOutcome,
    providerRoundTripDurationMilliseconds:
      input.providerRoundTripDurationMilliseconds,
    exactPrivateRuntimeResponseReread:
      input.exactPrivateRuntimeResponseReread,
    exactVertexPredictionWrapperReread:
      input.exactVertexPredictionWrapperReread,
    automaticRetryAllowed: false,
    knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation:
      input.knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation,
    unresolvedOutcomeBlocksRetry: input.unresolvedOutcomeBlocksRetry,
    canonicalServingWindowUsageCostAndCreditSettlementPending: true,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31CurrentVertexCustomerInvocationResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function assertExactRepositoryResult(input: {
  expected: CanonicalSam31CurrentVertexCustomerInvocationResult
  untrusted: unknown
}) {
  const reread = assertCanonicalSam31CurrentVertexCustomerInvocationResult(
    input.untrusted,
  )
  if (reread.resultHash !== input.expected.resultHash) {
    throw new Error('Current Vertex invocation result reread changed.')
  }
  return reread
}

function attemptRef(
  attempt: CanonicalSam31CurrentVertexCustomerInvocationAttempt,
): Ref {
  return ref(
    `sam31-current-vertex-attempt:${attempt.invocationId}`,
    attempt.attemptHash,
  )
}

function sameAttemptLineage(
  left: CanonicalSam31CurrentVertexCustomerInvocationAttempt,
  right: CanonicalSam31CurrentVertexCustomerInvocationAttempt,
) {
  return stableAuthorityStringify({
    ...left,
    attemptHash: null,
    consumedAt: null,
  }) === stableAuthorityStringify({
    ...right,
    attemptHash: null,
    consumedAt: null,
  })
}

function sameCallStartLineage(
  left: CanonicalSam31CurrentVertexCustomerCallStart,
  right: CanonicalSam31CurrentVertexCustomerCallStart,
) {
  return stableAuthorityStringify({
    ...left,
    callStartHash: null,
    startedAt: null,
  }) === stableAuthorityStringify({
    ...right,
    callStartHash: null,
    startedAt: null,
  })
}

function sameRef(left: Ref, right: Ref): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function ref(id: string, digest: string): Ref {
  return {
    id,
    version: 1,
    contentHash: digest.startsWith('sha256:')
      ? digest as `sha256:${string}`
      : `sha256:${digest}`,
  }
}

function recordPath(
  prefix: string,
  invocationId: string,
  kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
) {
  return `${prefix}/${invocationIdSchema.parse(invocationId)}/${kind}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    throw new Error('Current Vertex invocation prefix changed.')
  }
  return normalized
}

function elapsedMilliseconds(start: number, end: number): number {
  const elapsed = end - start
  if (!Number.isSafeInteger(elapsed) || elapsed < 0) {
    throw new Error('Current Vertex provider duration is invalid.')
  }
  return elapsed
}
