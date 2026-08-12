import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  rereadCanonicalSam31VertexDedicatedPredictionRoute,
} from './canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  isCanonicalSam31VertexScaleZeroDroppedBeforeInference429,
} from './canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  assertCanonicalSam31VertexServingQualificationPreparation,
  createCanonicalSam31VertexServingQualificationPreparationRef,
  createCanonicalSam31VertexServingQualificationPreparationRepository,
  type CanonicalSam31VertexServingQualificationPreparationRepository,
} from './canonical-sam3_1-vertex-serving-qualification-preparation-service'
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

export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_ATTEMPT_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-attempt-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_CALL_START_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-call-start-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_RESULT_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-result-v1' as const

const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks'
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-serving-qualification-invocations'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

const attemptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_ATTEMPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
  ),
  invocationPurpose: z.literal('private_pre_release_qualification'),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  invocationId: safeId,
  qualificationPreparationRef: refSchema,
  qualificationCandidateRef: refSchema,
  qualificationAdmissionRef: refSchema,
  taskRecordRef: refSchema,
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  currentA100ServingQuotaAuthorityRef: refSchema,
  dispatchAdmissionDigestSha256: sha256,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  attemptState: z.literal('qualification_admission_consumed'),
  createOnlySingleUseConsumption: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  callerEndpointModelStoragePathUrlOrBytesAccepted: z.literal(false),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  consumedAt: timestamp,
}).strict()
export const canonicalSam31VertexServingQualificationAttemptSchema =
  attemptWithoutHashSchema.extend({ attemptHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationAttempt = z.infer<
  typeof canonicalSam31VertexServingQualificationAttemptSchema
>

const callStartWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_CALL_START_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
  ),
  invocationPurpose: z.literal('private_pre_release_qualification'),
  invocationId: safeId,
  attemptRef: refSchema,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  callStartState: z.literal('provider_call_started'),
  createOnlyCallStart: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
}).strict()
export const canonicalSam31VertexServingQualificationCallStartSchema =
  callStartWithoutHashSchema.extend({ callStartHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationCallStart = z.infer<
  typeof canonicalSam31VertexServingQualificationCallStartSchema
>

const resultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
  ),
  invocationPurpose: z.literal('private_pre_release_qualification'),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  invocationId: safeId,
  qualificationPreparationRef: refSchema,
  qualificationCandidateRef: refSchema,
  attemptRef: refSchema,
  callStartRef: refSchema,
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
  unresolvedOutcomeBlocksRetry: z.boolean(),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
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
  if (unknown !== (result.providerOutcome === 'unknown')
    || notExecuted !== (result.providerOutcome === 'not_executed')
    || unknown !== result.unresolvedOutcomeBlocksRetry
    || unknown !== (result.terminalEvidenceMode === 'none_unknown')
    || notExecuted !== scaleZero
    || executedTerminal !== result.exactPrivateRuntimeResponseReread
    || prediction !== result.exactVertexPredictionWrapperReread
    || executedTerminal !== (result.runtimeStatus !== null)
    || executedTerminal !== (result.runtimeResponseRef !== null)
    || prediction !== (result.uploadedObjectCount !== null)
    || prediction !== (result.uploadedByteLength !== null)
    || (prediction || scaleZero) !==
      (result.providerRoundTripDurationMilliseconds !== null)
    || (executedTerminal && !prediction && !reconciliation)
    || (executedTerminal && result.disposition !== result.runtimeStatus)) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex serving qualification result lost terminal truth.',
    })
  }
})
export const canonicalSam31VertexServingQualificationResultSchema =
  resultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationResult = z.infer<
  typeof canonicalSam31VertexServingQualificationResultSchema
>

export interface CanonicalSam31VertexServingQualificationInvocationRepository {
  persistAttemptCreateOnly(input: {
    readonly attempt: CanonicalSam31VertexServingQualificationAttempt
  }): Promise<'created' | 'already_exists'>
  rereadAttempt(input: { readonly invocationId: string }): Promise<unknown>
  persistCallStartCreateOnly(input: {
    readonly callStart: CanonicalSam31VertexServingQualificationCallStart
  }): Promise<'created' | 'already_exists'>
  rereadCallStart(input: { readonly invocationId: string }): Promise<unknown>
  persistUnknownCreateOnly(input: {
    readonly result: CanonicalSam31VertexServingQualificationResult
  }): Promise<'created' | 'already_exists'>
  rereadUnknown(input: { readonly invocationId: string }): Promise<unknown>
  persistTerminalCreateOnly(input: {
    readonly result: CanonicalSam31VertexServingQualificationResult
  }): Promise<'created' | 'already_exists'>
  rereadTerminal(input: { readonly invocationId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexServingQualificationInvocationService(
  input: {
    readonly preparationRepository: Pick<
      CanonicalSam31VertexServingQualificationPreparationRepository,
      'reread'
    >
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly repository:
      CanonicalSam31VertexServingQualificationInvocationRepository
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly now?: () => string
    readonly clockMilliseconds?: () => number
    readonly timeoutMilliseconds?: number
  },
) {
  const auth = input.auth ?? new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const clock = input.clockMilliseconds ?? (() => Date.now())
  const timeout = input.timeoutMilliseconds ?? 600_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 600_000) {
    throw new Error('Vertex qualification invocation timeout changed.')
  }
  return Object.freeze({
    async invokeOne(untrusted: unknown): Promise<
      CanonicalSam31VertexServingQualificationResult
    > {
      assertPlainSerializedData(untrusted,
        'sam31_vertex_serving_qualification_invocation')
      const request = z.object({
        invocationId: safeId,
        qualificationPreparationRef: refSchema,
        dispatchAdmissionDigestSha256: sha256,
      }).strict().parse(untrusted)
      const invokedAt = timestamp.parse(now())
      const preparation =
        assertCanonicalSam31VertexServingQualificationPreparation(
          await input.preparationRepository.reread({
            invocationId: request.invocationId,
          }),
          invokedAt,
        )
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(request.invocationId),
      )
      assertInvocationLineage({ request, preparation, task })
      const predictionRoute =
        await rereadCanonicalSam31VertexDedicatedPredictionRoute({
          auth,
          timeoutMilliseconds: Math.min(timeout, 60_000),
        })
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
        : assertCanonicalSam31VertexServingQualificationAttempt(
          priorAttemptRaw,
        )
      const candidateAttempt = buildAttempt({ request, preparation, task,
        body, predictUrl: predictionRoute.predictUrl,
        consumedAt: priorAttempt?.consumedAt ?? invokedAt })
      const attemptDisposition = priorAttempt === null
        ? await input.repository.persistAttemptCreateOnly({
          attempt: candidateAttempt,
        })
        : 'already_exists' as const
      const attempt = priorAttempt ??
        assertCanonicalSam31VertexServingQualificationAttempt(
          await input.repository.rereadAttempt({
            invocationId: request.invocationId,
          }),
        )
      if (attemptDisposition === 'created'
        ? attempt.attemptHash !== candidateAttempt.attemptHash
        : !sameAttemptLineage(attempt, candidateAttempt)) {
        throw new Error('Vertex qualification attempt exact reread changed.')
      }
      if (attemptDisposition === 'already_exists') {
        const existing = await reconcileExisting({ attempt, preparation, task,
          taskStore: input.taskStore, repository: input.repository,
          observedAt: invokedAt })
        if (existing !== null) return existing
      }
      const candidateCallStart = buildCallStart({ attempt,
        startedAt: timestamp.parse(now()) })
      const callStartDisposition =
        await input.repository.persistCallStartCreateOnly({
          callStart: candidateCallStart,
        })
      const callStart = assertCanonicalSam31VertexServingQualificationCallStart(
        await input.repository.rereadCallStart({
          invocationId: request.invocationId,
        }),
      )
      if (callStartDisposition === 'created'
        ? callStart.callStartHash !== candidateCallStart.callStartHash
        : !sameCallStartLineage(callStart, candidateCallStart)) {
        throw new Error('Vertex qualification call-start reread changed.')
      }
      if (callStartDisposition === 'already_exists') {
        return persistUnknown({ attempt, callStart, preparation,
          repository: input.repository, observedAt: timestamp.parse(now()) })
      }
      const startedClock = clock()
      try {
        const response = await auth.request({
          url: predictionRoute.predictUrl,
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
        return persistTerminalFromPrediction({ prediction, attempt, callStart,
          preparation, task, taskStore: input.taskStore,
          repository: input.repository, providerRoundTripDurationMilliseconds:
            elapsed, observedAt: timestamp.parse(now()) })
      } catch (error) {
        const elapsed = elapsedMilliseconds(startedClock, clock())
        const observedAt = timestamp.parse(now())
        const runtime = await input.taskStore.rereadRuntimeResponse(
          request.invocationId,
        )
        if (runtime !== null) return persistTerminalFromRuntimeResponse({
          runtimeResponse: runtime, attempt, callStart, preparation, task,
          repository: input.repository, observedAt,
        })
        if (isCanonicalSam31VertexScaleZeroDroppedBeforeInference429(error)) {
          return persistScaleZeroNotExecuted({
            attempt,
            callStart,
            preparation,
            repository: input.repository,
            providerRoundTripDurationMilliseconds: elapsed,
            observedAt,
          })
        }
        return persistUnknown({ attempt, callStart, preparation,
          repository: input.repository, observedAt })
      }
    },
  })
}

export function createCanonicalSam31VertexServingQualificationInvocationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort;
    readonly prefix?: string },
): CanonicalSam31VertexServingQualificationInvocationRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex qualification invocation prefix changed.')
  }
  const persist = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    value: CanonicalSam31VertexServingQualificationAttempt
      | CanonicalSam31VertexServingQualificationCallStart
      | CanonicalSam31VertexServingQualificationResult,
  ) => {
    const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
    return input.objectPort.createOnly({
      objectPath: `${prefix}/${safeId.parse(value.invocationId)}/${kind}.json`,
      body,
      contentSha256: createHash('sha256').update(body).digest('hex'),
    })
  }
  const read = async (kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    invocationId: string) => {
    const body = await input.objectPort.readExact(
      `${prefix}/${safeId.parse(invocationId)}/${kind}.json`,
    )
    if (!body) return null
    const decoded = JSON.parse(body.toString('utf8')) as unknown
    const parsed = kind === 'attempt'
      ? assertCanonicalSam31VertexServingQualificationAttempt(decoded)
      : kind === 'call-start'
        ? assertCanonicalSam31VertexServingQualificationCallStart(decoded)
        : assertCanonicalSam31VertexServingQualificationResult(decoded)
    if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
      throw new Error('Vertex qualification invocation bytes changed.')
    }
    return structuredClone(parsed)
  }
  const repository: CanonicalSam31VertexServingQualificationInvocationRepository = {
    persistAttemptCreateOnly: ({ attempt }) => persist('attempt',
      assertCanonicalSam31VertexServingQualificationAttempt(attempt)),
    rereadAttempt: ({ invocationId }) => read('attempt', invocationId),
    persistCallStartCreateOnly: ({ callStart }) => persist('call-start',
      assertCanonicalSam31VertexServingQualificationCallStart(callStart)),
    rereadCallStart: ({ invocationId }) => read('call-start', invocationId),
    persistUnknownCreateOnly: ({ result }) => {
      const accepted = assertCanonicalSam31VertexServingQualificationResult(
        result,
      )
      if (accepted.disposition !==
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Vertex qualification unknown record is terminal.')
      }
      return persist('unknown', accepted)
    },
    rereadUnknown: ({ invocationId }) => read('unknown', invocationId),
    persistTerminalCreateOnly: ({ result }) => {
      const accepted = assertCanonicalSam31VertexServingQualificationResult(
        result,
      )
      if (accepted.disposition ===
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Vertex qualification terminal record is unknown.')
      }
      return persist('terminal', accepted)
    },
    rereadTerminal: ({ invocationId }) => read('terminal', invocationId),
  }
  return Object.freeze(repository)
}

export function createCanonicalGcpSam31VertexServingQualificationInvocationService(
  input: { readonly storage?: Storage; readonly auth?: Pick<GoogleAuth,
    'request'>; readonly now?: () => string;
    readonly clockMilliseconds?: () => number } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const state = createCanonicalGcsSourceAnalysisJsonObjectPort({ storage,
    bucketName: STATE_BUCKET })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({ storage,
    bucketName: PRIVATE_GPU_BUCKET,
    acceptedReadContentTypes: [
      'application/json',
      'application/octet-stream',
    ],
  })
  return createCanonicalSam31VertexServingQualificationInvocationService({
    preparationRepository:
      createCanonicalSam31VertexServingQualificationPreparationRepository({
        objectPort: state,
      }),
    taskStore: createCanonicalSam31GpuTaskStoreFromObjectPort({
      objectPort: privateGpu,
      prefix: TASK_PREFIX,
    }),
    repository:
      createCanonicalSam31VertexServingQualificationInvocationRepository({
        objectPort: state,
      }),
    auth: input.auth,
    now: input.now,
    clockMilliseconds: input.clockMilliseconds,
  })
}

export function assertCanonicalSam31VertexServingQualificationAttempt(
  value: unknown,
): CanonicalSam31VertexServingQualificationAttempt {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_attempt')
  const parsed = canonicalSam31VertexServingQualificationAttemptSchema.parse(
    value,
  )
  const { attemptHash, ...payload } = parsed
  if (attemptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification attempt digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingQualificationCallStart(
  value: unknown,
): CanonicalSam31VertexServingQualificationCallStart {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_call_start')
  const parsed =
    canonicalSam31VertexServingQualificationCallStartSchema.parse(value)
  const { callStartHash, ...payload } = parsed
  if (callStartHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification call-start digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingQualificationResult(
  value: unknown,
): CanonicalSam31VertexServingQualificationResult {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_result')
  const parsed = canonicalSam31VertexServingQualificationResultSchema.parse(
    value,
  )
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification result digest changed.')
  }
  return parsed
}

function buildAttempt(input: {
  request: { invocationId: string; qualificationPreparationRef: Ref;
    dispatchAdmissionDigestSha256: string }
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  body: unknown
  predictUrl: string
  consumedAt: string
}) {
  const payload = attemptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_ATTEMPT_VERSION,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
    invocationPurpose: 'private_pre_release_qualification',
    qualificationId: input.preparation.qualificationId,
    runOrdinal: input.preparation.runOrdinal,
    invocationId: input.request.invocationId,
    qualificationPreparationRef: input.request.qualificationPreparationRef,
    qualificationCandidateRef:
      input.preparation.qualificationCandidateRef,
    qualificationAdmissionRef: input.preparation.admissionRef,
    taskRecordRef: input.preparation.taskRecordRef,
    currentA100ServingRateAuthorityRef:
      input.preparation.currentA100ServingRateAuthorityRef,
    currentL4FallbackRateAuthorityRef:
      input.preparation.currentL4FallbackRateAuthorityRef,
    currentA100ServingQuotaAuthorityRef:
      input.preparation.currentA100ServingQuotaAuthorityRef,
    dispatchAdmissionDigestSha256:
      input.request.dispatchAdmissionDigestSha256,
    requestBodyDigestSha256: sha256AuthorityValue(input.body),
    predictUrlDigestSha256: sha256AuthorityValue({ url: input.predictUrl }),
    attemptState: 'qualification_admission_consumed',
    createOnlySingleUseConsumption: true,
    automaticRetryAllowed: false,
    callerEndpointModelStoragePathUrlOrBytesAccepted: false,
    customerInvocationAuthorized: false,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    consumedAt: input.consumedAt,
  })
  return canonicalSam31VertexServingQualificationAttemptSchema.parse({
    ...payload,
    attemptHash: sha256AuthorityValue(payload),
  })
}

function buildCallStart(input: {
  attempt: CanonicalSam31VertexServingQualificationAttempt
  startedAt: string
}) {
  const payload = callStartWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_CALL_START_VERSION,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
    invocationPurpose: 'private_pre_release_qualification',
    invocationId: input.attempt.invocationId,
    attemptRef: attemptRef(input.attempt),
    requestBodyDigestSha256: input.attempt.requestBodyDigestSha256,
    predictUrlDigestSha256: input.attempt.predictUrlDigestSha256,
    callStartState: 'provider_call_started',
    createOnlyCallStart: true,
    automaticRetryAllowed: false,
    customerInvocationAuthorized: false,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    startedAt: input.startedAt,
  })
  return canonicalSam31VertexServingQualificationCallStartSchema.parse({
    ...payload,
    callStartHash: sha256AuthorityValue(payload),
  })
}

function parsePrediction(value: unknown, invocationId: string) {
  return z.object({
    deployedModelId: z.literal('3101000001'),
    model: z.literal(
      'projects/390722338345/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    ),
    modelDisplayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    modelVersionId: z.literal('1'),
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
  attempt: CanonicalSam31VertexServingQualificationAttempt
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  observedAt: string
}) {
  const terminal = await input.repository.rereadTerminal({
    invocationId: input.attempt.invocationId,
  })
  if (terminal !== null) {
    return assertCanonicalSam31VertexServingQualificationResult(terminal)
  }
  const response = await input.taskStore.rereadRuntimeResponse(
    input.attempt.invocationId,
  )
  const callStartRaw = await input.repository.rereadCallStart({
    invocationId: input.attempt.invocationId,
  })
  if (response !== null && callStartRaw !== null) {
    return persistTerminalFromRuntimeResponse({ runtimeResponse: response,
      attempt: input.attempt,
      callStart:
        assertCanonicalSam31VertexServingQualificationCallStart(callStartRaw),
      preparation: input.preparation, task: input.task,
      repository: input.repository, observedAt: input.observedAt })
  }
  const unknown = await input.repository.rereadUnknown({
    invocationId: input.attempt.invocationId,
  })
  if (unknown !== null) {
    return assertCanonicalSam31VertexServingQualificationResult(unknown)
  }
  if (callStartRaw === null) return null
  return persistUnknown({ attempt: input.attempt,
    callStart:
      assertCanonicalSam31VertexServingQualificationCallStart(callStartRaw),
    preparation: input.preparation, repository: input.repository,
    observedAt: input.observedAt })
}

async function persistTerminalFromPrediction(input: {
  prediction: ReturnType<typeof parsePrediction>
  attempt: CanonicalSam31VertexServingQualificationAttempt
  callStart: CanonicalSam31VertexServingQualificationCallStart
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  providerRoundTripDurationMilliseconds: number
  observedAt: string
}) {
  const runtime = await input.taskStore.rereadRuntimeResponse(
    input.attempt.invocationId,
  )
  if (runtime === null) {
    throw new Error('Vertex qualification prediction response is absent.')
  }
  const exact = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: runtime,
  })
  const digest = createHash('sha256')
    .update(canonicalSam31GpuWireStringify(exact)).digest('hex')
  if (input.prediction.runtimeStatus !== exact.status
    || input.prediction.responseRef.contentHash !== `sha256:${digest}`) {
    throw new Error('Vertex qualification prediction and response differ.')
  }
  return persistTerminal({ attempt: input.attempt, callStart: input.callStart,
    preparation: input.preparation, repository: input.repository,
    runtimeStatus: exact.status,
    runtimeResponseRef: input.prediction.responseRef,
    uploadedObjectCount: input.prediction.uploadedObjectCount,
    uploadedByteLength: input.prediction.uploadedByteLength,
    terminalEvidenceMode: 'provider_prediction_and_private_response',
    providerRoundTripDurationMilliseconds:
      input.providerRoundTripDurationMilliseconds,
    exactVertexPredictionWrapperReread: true,
    observedAt: input.observedAt })
}

async function persistTerminalFromRuntimeResponse(input: {
  runtimeResponse: unknown
  attempt: CanonicalSam31VertexServingQualificationAttempt
  callStart: CanonicalSam31VertexServingQualificationCallStart
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  observedAt: string
}) {
  const exact = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: input.runtimeResponse,
  })
  const bytes = Buffer.from(canonicalSam31GpuWireStringify(exact), 'utf8')
  return persistTerminal({ attempt: input.attempt, callStart: input.callStart,
    preparation: input.preparation, repository: input.repository,
    runtimeStatus: exact.status,
    runtimeResponseRef: {
      id: `sam31-gpu-response:${input.attempt.invocationId}`,
      version: 1,
      contentHash: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    },
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'private_response_reconciliation',
    providerRoundTripDurationMilliseconds: null,
    exactVertexPredictionWrapperReread: false,
    observedAt: input.observedAt })
}

async function persistTerminal(input: {
  attempt: CanonicalSam31VertexServingQualificationAttempt
  callStart: CanonicalSam31VertexServingQualificationCallStart
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  runtimeStatus: 'completed' | 'failed'
  runtimeResponseRef: Ref
  uploadedObjectCount: number | null
  uploadedByteLength: number | null
  terminalEvidenceMode: 'provider_prediction_and_private_response'
    | 'private_response_reconciliation'
  providerRoundTripDurationMilliseconds: number | null
  exactVertexPredictionWrapperReread: boolean
  observedAt: string
}) {
  const result = buildResult({ ...input,
    disposition: input.runtimeStatus,
    providerOutcome: 'executed',
    exactPrivateRuntimeResponseReread: true,
    unresolvedOutcomeBlocksRetry: false })
  await input.repository.persistTerminalCreateOnly({ result })
  return exactResult(result, await input.repository.rereadTerminal({
    invocationId: input.attempt.invocationId,
  }))
}

async function persistUnknown(input: {
  attempt: CanonicalSam31VertexServingQualificationAttempt
  callStart: CanonicalSam31VertexServingQualificationCallStart
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  observedAt: string
}) {
  const result = buildResult({ ...input,
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
    unresolvedOutcomeBlocksRetry: true })
  await input.repository.persistUnknownCreateOnly({ result })
  return exactResult(result, await input.repository.rereadUnknown({
    invocationId: input.attempt.invocationId,
  }))
}

async function persistScaleZeroNotExecuted(input: {
  attempt: CanonicalSam31VertexServingQualificationAttempt
  callStart: CanonicalSam31VertexServingQualificationCallStart
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  repository: CanonicalSam31VertexServingQualificationInvocationRepository
  providerRoundTripDurationMilliseconds: number
  observedAt: string
}) {
  const result = buildResult({ ...input,
    disposition: 'not_executed_scale_from_zero_trigger',
    runtimeStatus: null,
    runtimeResponseRef: null,
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'vertex_scale_zero_429_before_inference',
    providerOutcome: 'not_executed',
    exactPrivateRuntimeResponseReread: false,
    exactVertexPredictionWrapperReread: false,
    unresolvedOutcomeBlocksRetry: false })
  await input.repository.persistTerminalCreateOnly({ result })
  return exactResult(result, await input.repository.rereadTerminal({
    invocationId: input.attempt.invocationId,
  }))
}

function buildResult(input: {
  attempt: CanonicalSam31VertexServingQualificationAttempt
  callStart: CanonicalSam31VertexServingQualificationCallStart
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  disposition: 'completed' | 'failed'
    | 'not_executed_scale_from_zero_trigger'
    | 'outcome_unknown_requires_reconciliation'
  runtimeStatus: 'completed' | 'failed' | null
  runtimeResponseRef: Ref | null
  uploadedObjectCount: number | null
  uploadedByteLength: number | null
  terminalEvidenceMode: 'provider_prediction_and_private_response'
    | 'private_response_reconciliation'
    | 'vertex_scale_zero_429_before_inference' | 'none_unknown'
  providerOutcome: 'executed' | 'not_executed' | 'unknown'
  providerRoundTripDurationMilliseconds: number | null
  exactPrivateRuntimeResponseReread: boolean
  exactVertexPredictionWrapperReread: boolean
  unresolvedOutcomeBlocksRetry: boolean
  observedAt: string
}) {
  const payload = resultWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_RESULT_VERSION,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
    invocationPurpose: 'private_pre_release_qualification',
    qualificationId: input.preparation.qualificationId,
    runOrdinal: input.preparation.runOrdinal,
    invocationId: input.attempt.invocationId,
    qualificationPreparationRef:
      input.attempt.qualificationPreparationRef,
    qualificationCandidateRef: input.preparation.qualificationCandidateRef,
    attemptRef: attemptRef(input.attempt),
    callStartRef: {
      id: `sam31-vertex-qualification-call-start:${input.attempt.invocationId}`,
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
    providerRoundTripDurationMilliseconds:
      input.providerRoundTripDurationMilliseconds,
    exactPrivateRuntimeResponseReread:
      input.exactPrivateRuntimeResponseReread,
    exactVertexPredictionWrapperReread:
      input.exactVertexPredictionWrapperReread,
    automaticRetryAllowed: false,
    unresolvedOutcomeBlocksRetry: input.unresolvedOutcomeBlocksRetry,
    customerInvocationAuthorized: false,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31VertexServingQualificationResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function assertInvocationLineage(input: {
  request: { invocationId: string; qualificationPreparationRef: Ref;
    dispatchAdmissionDigestSha256: string }
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
}): void {
  if (input.preparation.invocationId !== input.request.invocationId
    || !sameRef(
      createCanonicalSam31VertexServingQualificationPreparationRef(
        input.preparation,
      ),
      input.request.qualificationPreparationRef,
    )
    || input.preparation.dispatchAdmissionDigestSha256 !==
      input.request.dispatchAdmissionDigestSha256
    || !sameRef(input.preparation.taskRecordRef, {
      id: input.task.taskId,
      version: 1,
      contentHash: `sha256:${input.task.taskRecordHash}`,
    })
    || !sameRef(input.preparation.admissionRef,
      input.task.dispatchAdmissionRef)
    || !sameRef(input.preparation.qualificationCandidateRef,
      input.task.runtimeReleaseRef)
    || input.task.runtimeRequest.dispatchAdmissionDigestSha256 !==
      input.request.dispatchAdmissionDigestSha256
    || input.task.runtimeRequest.dispatch.routeRole !==
      'a100_80gb_heavy_primary'
    || input.task.runtimeRequest.dispatch.accelerator !== 'nvidia_a100_80gb'
    || input.task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed
    || !input.task.runtimeRequest.dispatch.scaleFromZeroRequired
    || input.task.cloudJobCreated
    || input.task.customerCreditsMutated
    || input.task.productionAuthorityGranted) {
    throw new Error('Vertex qualification invocation lineage changed.')
  }
}

function exactResult(expected: CanonicalSam31VertexServingQualificationResult,
  value: unknown) {
  const parsed = assertCanonicalSam31VertexServingQualificationResult(value)
  if (parsed.resultHash !== expected.resultHash) {
    throw new Error('Vertex qualification result exact reread changed.')
  }
  return parsed
}

function attemptRef(
  attempt: CanonicalSam31VertexServingQualificationAttempt,
): Ref {
  return {
    id: `sam31-vertex-qualification-attempt:${attempt.invocationId}`,
    version: 1,
    contentHash: `sha256:${attempt.attemptHash}`,
  }
}

function sameRef(left: Ref, right: Ref): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameAttemptLineage(
  left: CanonicalSam31VertexServingQualificationAttempt,
  right: CanonicalSam31VertexServingQualificationAttempt,
) {
  return stableAuthorityStringify(omit(left, ['attemptHash', 'consumedAt'])) ===
    stableAuthorityStringify(omit(right, ['attemptHash', 'consumedAt']))
}

function sameCallStartLineage(
  left: CanonicalSam31VertexServingQualificationCallStart,
  right: CanonicalSam31VertexServingQualificationCallStart,
) {
  return stableAuthorityStringify(omit(left, ['callStartHash', 'startedAt'])) ===
    stableAuthorityStringify(omit(right, ['callStartHash', 'startedAt']))
}

function omit(value: Readonly<Record<string, unknown>>,
  keys: readonly string[]) {
  return Object.fromEntries(Object.entries(value).filter(([key]) =>
    !keys.includes(key)))
}

function elapsedMilliseconds(start: number, end: number): number {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
    || end < start || end - start > 600_000) {
    throw new Error('Vertex qualification round-trip clock changed.')
  }
  return end - start
}
