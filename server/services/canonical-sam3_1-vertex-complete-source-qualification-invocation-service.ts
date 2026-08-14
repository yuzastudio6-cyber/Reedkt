import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
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
  assertCanonicalSam31VertexCompleteSourceQualificationPreparation,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository,
  type CanonicalSam31VertexCompleteSourceQualificationPreparation,
  type CanonicalSam31VertexCompleteSourceQualificationPreparationRepository,
} from './canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_ATTEMPT_VERSION =
  'canonical-sam3_1-vertex-complete-source-qualification-attempt-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_CALL_START_VERSION =
  'canonical-sam3_1-vertex-complete-source-qualification-call-start-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_RESULT_VERSION =
  'canonical-sam3_1-vertex-complete-source-qualification-result-v1' as const

const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks'
const TASK_PREFIX = 'private/canonical-professional-gpu/sam3_1/v1/invocations'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-complete-source-qualification-invocations'
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
type EvidenceRef = z.infer<typeof refSchema>

const attemptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_ATTEMPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
  ),
  invocationPurpose: z.literal(
    'private_complete_source_pre_release_qualification',
  ),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  chunkOrdinal: z.number().int().min(1).max(49).safe(),
  invocationId: safeId,
  qualificationPreparationRef: refSchema,
  parentQualificationAdmissionRef: refSchema,
  qualificationCandidateRef: refSchema,
  chunkQualificationAdmissionRef: refSchema,
  taskRecordRef: refSchema,
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  dispatchAdmissionDigestSha256: sha256,
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  attemptState: z.literal('qualification_chunk_admission_consumed'),
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
}).strict().superRefine((value, context) => {
  if (value.canonicalEndFrameInclusive < value.canonicalStartFrameInclusive) {
    context.addIssue({
      code: 'custom',
      message: 'Complete-source qualification attempt range changed.',
    })
  }
})
export const canonicalSam31VertexCompleteSourceQualificationAttemptSchema =
  attemptWithoutHashSchema.extend({ attemptHash: sha256 }).strict()
export type CanonicalSam31VertexCompleteSourceQualificationAttempt = z.infer<
  typeof canonicalSam31VertexCompleteSourceQualificationAttemptSchema
>

const callStartWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_CALL_START_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
  ),
  invocationPurpose: z.literal(
    'private_complete_source_pre_release_qualification',
  ),
  invocationId: safeId,
  chunkOrdinal: z.number().int().min(1).max(49).safe(),
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
export const canonicalSam31VertexCompleteSourceQualificationCallStartSchema =
  callStartWithoutHashSchema.extend({ callStartHash: sha256 }).strict()
export type CanonicalSam31VertexCompleteSourceQualificationCallStart = z.infer<
  typeof canonicalSam31VertexCompleteSourceQualificationCallStartSchema
>

const resultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
  ),
  invocationPurpose: z.literal(
    'private_complete_source_pre_release_qualification',
  ),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  chunkOrdinal: z.number().int().min(1).max(49).safe(),
  invocationId: safeId,
  qualificationPreparationRef: refSchema,
  parentQualificationAdmissionRef: refSchema,
  qualificationCandidateRef: refSchema,
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
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
}).strict().superRefine((value, context) => {
  const unknown = value.disposition ===
    'outcome_unknown_requires_reconciliation'
  const notExecuted = value.disposition ===
    'not_executed_scale_from_zero_trigger'
  const executed = !unknown && !notExecuted
  const prediction = value.terminalEvidenceMode ===
    'provider_prediction_and_private_response'
  const reconciliation = value.terminalEvidenceMode ===
    'private_response_reconciliation'
  const scaleZero = value.terminalEvidenceMode ===
    'vertex_scale_zero_429_before_inference'
  const exact = unknown === (value.providerOutcome === 'unknown')
    && notExecuted === (value.providerOutcome === 'not_executed')
    && unknown === value.unresolvedOutcomeBlocksRetry
    && unknown === (value.terminalEvidenceMode === 'none_unknown')
    && notExecuted === scaleZero
    && executed === value.exactPrivateRuntimeResponseReread
    && prediction === value.exactVertexPredictionWrapperReread
    && executed === (value.runtimeStatus !== null)
    && executed === (value.runtimeResponseRef !== null)
    && prediction === (value.uploadedObjectCount !== null)
    && prediction === (value.uploadedByteLength !== null)
    && (prediction || scaleZero) ===
      (value.providerRoundTripDurationMilliseconds !== null)
    && (!executed || prediction || reconciliation)
    && (!executed || value.disposition === value.runtimeStatus)
    && value.canonicalEndFrameInclusive >= value.canonicalStartFrameInclusive
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Complete-source qualification result lost terminal truth.',
  })
})
export const canonicalSam31VertexCompleteSourceQualificationResultSchema =
  resultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31VertexCompleteSourceQualificationResult = z.infer<
  typeof canonicalSam31VertexCompleteSourceQualificationResultSchema
>

export interface CanonicalSam31VertexCompleteSourceQualificationInvocationRepository {
  persistAttemptCreateOnly(input: {
    readonly attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  }): Promise<'created' | 'already_exists'>
  rereadAttempt(input: { readonly invocationId: string }): Promise<unknown>
  persistCallStartCreateOnly(input: {
    readonly callStart:
      CanonicalSam31VertexCompleteSourceQualificationCallStart
  }): Promise<'created' | 'already_exists'>
  rereadCallStart(input: { readonly invocationId: string }): Promise<unknown>
  persistUnknownCreateOnly(input: {
    readonly result: CanonicalSam31VertexCompleteSourceQualificationResult
  }): Promise<'created' | 'already_exists'>
  rereadUnknown(input: { readonly invocationId: string }): Promise<unknown>
  persistTerminalCreateOnly(input: {
    readonly result: CanonicalSam31VertexCompleteSourceQualificationResult
  }): Promise<'created' | 'already_exists'>
  rereadTerminal(input: { readonly invocationId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexCompleteSourceQualificationInvocationService(
  input: {
    readonly preparationRepository: Pick<
      CanonicalSam31VertexCompleteSourceQualificationPreparationRepository,
      'reread'
    >
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly repository:
      CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
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
    throw new Error('Complete-source qualification timeout changed.')
  }
  return Object.freeze({
    async invokeOne(untrusted: unknown): Promise<
      CanonicalSam31VertexCompleteSourceQualificationResult
    > {
      assertPlainSerializedData(untrusted,
        'sam31_vertex_complete_source_qualification_invocation')
      const request = z.object({
        invocationId: safeId,
        qualificationPreparationRef: refSchema,
        dispatchAdmissionDigestSha256: sha256,
      }).strict().parse(untrusted)
      const invokedAt = timestamp.parse(now())
      const preparation =
        assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
          await input.preparationRepository.reread({
            invocationId: request.invocationId,
          }),
          invokedAt,
        )
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(request.invocationId),
      )
      assertInvocationLineage({ request, preparation, task })
      const route = await rereadCanonicalSam31VertexDedicatedPredictionRoute({
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
      const priorRaw = await input.repository.rereadAttempt({
        invocationId: request.invocationId,
      })
      const prior = priorRaw === null ? null
        : assertCanonicalSam31VertexCompleteSourceQualificationAttempt(
          priorRaw,
        )
      const candidateAttempt = buildAttempt({ request, preparation, task,
        body, predictUrl: route.predictUrl,
        consumedAt: prior?.consumedAt ?? invokedAt })
      const attemptDisposition = prior === null
        ? await input.repository.persistAttemptCreateOnly({
          attempt: candidateAttempt,
        })
        : 'already_exists' as const
      const attempt = prior ??
        assertCanonicalSam31VertexCompleteSourceQualificationAttempt(
          await input.repository.rereadAttempt({
            invocationId: request.invocationId,
          }),
        )
      if (attemptDisposition === 'created'
        ? attempt.attemptHash !== candidateAttempt.attemptHash
        : !sameAttemptLineage(attempt, candidateAttempt)) {
        throw new Error('Complete-source qualification attempt changed.')
      }
      if (attemptDisposition === 'already_exists') {
        const existing = await reconcileExisting({ attempt, preparation,
          task, taskStore: input.taskStore, repository: input.repository,
          observedAt: invokedAt })
        if (existing) return existing
      }
      const candidateCallStart = buildCallStart({ attempt,
        startedAt: timestamp.parse(now()) })
      const callStartDisposition =
        await input.repository.persistCallStartCreateOnly({
          callStart: candidateCallStart,
        })
      const callStart =
        assertCanonicalSam31VertexCompleteSourceQualificationCallStart(
          await input.repository.rereadCallStart({
            invocationId: request.invocationId,
          }),
        )
      if (callStartDisposition === 'created'
        ? callStart.callStartHash !== candidateCallStart.callStartHash
        : !sameCallStartLineage(callStart, candidateCallStart)) {
        throw new Error('Complete-source qualification call-start changed.')
      }
      if (callStartDisposition === 'already_exists') {
        return persistUnknown({ attempt, callStart, preparation,
          repository: input.repository, observedAt: timestamp.parse(now()) })
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
        return persistTerminalFromPrediction({ prediction, attempt, callStart,
          preparation, task, taskStore: input.taskStore,
          repository: input.repository,
          providerRoundTripDurationMilliseconds: elapsed,
          observedAt: timestamp.parse(now()) })
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
          return persistScaleZeroNotExecuted({ attempt, callStart,
            preparation, repository: input.repository,
            providerRoundTripDurationMilliseconds: elapsed, observedAt })
        }
        return persistUnknown({ attempt, callStart, preparation,
          repository: input.repository, observedAt })
      }
    },
  })
}

export function createCanonicalSam31VertexCompleteSourceQualificationInvocationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort;
    readonly prefix?: string },
): CanonicalSam31VertexCompleteSourceQualificationInvocationRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Complete-source qualification prefix changed.')
  }
  const persist = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    value: CanonicalSam31VertexCompleteSourceQualificationAttempt
      | CanonicalSam31VertexCompleteSourceQualificationCallStart
      | CanonicalSam31VertexCompleteSourceQualificationResult,
  ) => {
    const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
    return input.objectPort.createOnly({
      objectPath: `${prefix}/${safeId.parse(value.invocationId)}/${kind}.json`,
      body,
      contentSha256: createHash('sha256').update(body).digest('hex'),
    })
  }
  const read = async (
    kind: 'attempt' | 'call-start' | 'unknown' | 'terminal',
    invocationId: string,
  ) => {
    const body = await input.objectPort.readExact(
      `${prefix}/${safeId.parse(invocationId)}/${kind}.json`,
    )
    if (!body) return null
    const decoded = JSON.parse(body.toString('utf8')) as unknown
    const parsed = kind === 'attempt'
      ? assertCanonicalSam31VertexCompleteSourceQualificationAttempt(decoded)
      : kind === 'call-start'
        ? assertCanonicalSam31VertexCompleteSourceQualificationCallStart(
          decoded,
        )
        : assertCanonicalSam31VertexCompleteSourceQualificationResult(decoded)
    if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
      throw new Error('Complete-source qualification bytes changed.')
    }
    return structuredClone(parsed)
  }
  const repository:
  CanonicalSam31VertexCompleteSourceQualificationInvocationRepository = {
    persistAttemptCreateOnly: ({ attempt }) => persist('attempt',
      assertCanonicalSam31VertexCompleteSourceQualificationAttempt(attempt)),
    rereadAttempt: ({ invocationId }) => read('attempt', invocationId),
    persistCallStartCreateOnly: ({ callStart }) => persist('call-start',
      assertCanonicalSam31VertexCompleteSourceQualificationCallStart(
        callStart,
      )),
    rereadCallStart: ({ invocationId }) => read('call-start', invocationId),
    persistUnknownCreateOnly: ({ result }) => {
      const accepted =
        assertCanonicalSam31VertexCompleteSourceQualificationResult(result)
      if (accepted.disposition !==
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Complete-source unknown record is terminal.')
      }
      return persist('unknown', accepted)
    },
    rereadUnknown: ({ invocationId }) => read('unknown', invocationId),
    persistTerminalCreateOnly: ({ result }) => {
      const accepted =
        assertCanonicalSam31VertexCompleteSourceQualificationResult(result)
      if (accepted.disposition ===
        'outcome_unknown_requires_reconciliation') {
        throw new Error('Complete-source terminal record is unknown.')
      }
      return persist('terminal', accepted)
    },
    rereadTerminal: ({ invocationId }) => read('terminal', invocationId),
  }
  return Object.freeze(repository)
}

export function createCanonicalGcpSam31VertexCompleteSourceQualificationInvocationService(
  input: { readonly storage?: Storage; readonly auth?: Pick<GoogleAuth,
    'request'>; readonly now?: () => string;
    readonly clockMilliseconds?: () => number } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const state = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: STATE_BUCKET,
  })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: PRIVATE_GPU_BUCKET,
    acceptedReadContentTypes: ['application/json', 'application/octet-stream'],
  })
  return createCanonicalSam31VertexCompleteSourceQualificationInvocationService({
    preparationRepository:
      createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository({
        objectPort: state,
      }),
    taskStore: createCanonicalSam31GpuTaskStoreFromObjectPort({
      objectPort: privateGpu,
      prefix: TASK_PREFIX,
    }),
    repository:
      createCanonicalSam31VertexCompleteSourceQualificationInvocationRepository({
        objectPort: state,
      }),
    auth: input.auth,
    now: input.now,
    clockMilliseconds: input.clockMilliseconds,
  })
}

export function assertCanonicalSam31VertexCompleteSourceQualificationAttempt(
  value: unknown,
): CanonicalSam31VertexCompleteSourceQualificationAttempt {
  assertPlainSerializedData(value,
    'sam31_vertex_complete_source_qualification_attempt')
  const parsed =
    canonicalSam31VertexCompleteSourceQualificationAttemptSchema.parse(value)
  const { attemptHash, ...payload } = parsed
  if (attemptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Complete-source qualification attempt digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexCompleteSourceQualificationCallStart(
  value: unknown,
): CanonicalSam31VertexCompleteSourceQualificationCallStart {
  assertPlainSerializedData(value,
    'sam31_vertex_complete_source_qualification_call_start')
  const parsed =
    canonicalSam31VertexCompleteSourceQualificationCallStartSchema.parse(value)
  const { callStartHash, ...payload } = parsed
  if (callStartHash !== sha256AuthorityValue(payload)) {
    throw new Error('Complete-source qualification call-start changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexCompleteSourceQualificationResult(
  value: unknown,
): CanonicalSam31VertexCompleteSourceQualificationResult {
  assertPlainSerializedData(value,
    'sam31_vertex_complete_source_qualification_result')
  const parsed =
    canonicalSam31VertexCompleteSourceQualificationResultSchema.parse(value)
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new Error('Complete-source qualification result digest changed.')
  }
  return parsed
}

function buildAttempt(input: {
  request: { invocationId: string; qualificationPreparationRef: EvidenceRef;
    dispatchAdmissionDigestSha256: string }
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  body: unknown
  predictUrl: string
  consumedAt: string
}) {
  const payload = attemptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_ATTEMPT_VERSION,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
    invocationPurpose: 'private_complete_source_pre_release_qualification',
    qualificationId: input.preparation.qualificationId,
    runOrdinal: input.preparation.runOrdinal,
    chunkOrdinal: input.preparation.chunkOrdinal,
    invocationId: input.request.invocationId,
    qualificationPreparationRef: input.request.qualificationPreparationRef,
    parentQualificationAdmissionRef:
      input.preparation.parentQualificationAdmissionRef,
    qualificationCandidateRef: input.preparation.qualificationCandidateRef,
    chunkQualificationAdmissionRef: input.preparation.admissionRef,
    taskRecordRef: input.preparation.taskRecordRef,
    preparedChunkArtifactRef: input.preparation.preparedChunkArtifactRef,
    exactSourceRangeMappingRef: input.preparation.exactSourceRangeMappingRef,
    canonicalStartFrameInclusive:
      input.preparation.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: input.preparation.canonicalEndFrameInclusive,
    currentA100ServingRateAuthorityRef:
      input.preparation.currentA100ServingRateAuthorityRef,
    currentL4FallbackRateAuthorityRef:
      input.preparation.currentL4FallbackRateAuthorityRef,
    dispatchAdmissionDigestSha256:
      input.request.dispatchAdmissionDigestSha256,
    requestBodyDigestSha256: sha256AuthorityValue(input.body),
    predictUrlDigestSha256: sha256AuthorityValue({ url: input.predictUrl }),
    attemptState: 'qualification_chunk_admission_consumed',
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
  return canonicalSam31VertexCompleteSourceQualificationAttemptSchema.parse({
    ...payload,
    attemptHash: sha256AuthorityValue(payload),
  })
}

function buildCallStart(input: {
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  startedAt: string
}) {
  const payload = callStartWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_CALL_START_VERSION,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
    invocationPurpose: 'private_complete_source_pre_release_qualification',
    invocationId: input.attempt.invocationId,
    chunkOrdinal: input.attempt.chunkOrdinal,
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
  return canonicalSam31VertexCompleteSourceQualificationCallStartSchema.parse({
    ...payload,
    callStartHash: sha256AuthorityValue(payload),
  })
}

function parsePrediction(value: unknown, invocationId: string) {
  return z.object({
    deployedModelId: z.literal(
      CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
    ),
    model: z.literal(CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE),
    modelDisplayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    modelVersionId: z.literal(
      CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
    ),
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
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
  observedAt: string
}) {
  const terminal = await input.repository.rereadTerminal({
    invocationId: input.attempt.invocationId,
  })
  if (terminal !== null) {
    return assertCanonicalSam31VertexCompleteSourceQualificationResult(terminal)
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
        assertCanonicalSam31VertexCompleteSourceQualificationCallStart(
          callStartRaw,
        ),
      preparation: input.preparation, task: input.task,
      repository: input.repository, observedAt: input.observedAt })
  }
  const unknown = await input.repository.rereadUnknown({
    invocationId: input.attempt.invocationId,
  })
  if (unknown !== null) {
    return assertCanonicalSam31VertexCompleteSourceQualificationResult(unknown)
  }
  if (callStartRaw === null) return null
  return persistUnknown({ attempt: input.attempt,
    callStart:
      assertCanonicalSam31VertexCompleteSourceQualificationCallStart(
        callStartRaw,
      ),
    preparation: input.preparation, repository: input.repository,
    observedAt: input.observedAt })
}

async function persistTerminalFromPrediction(input: {
  prediction: ReturnType<typeof parsePrediction>
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  callStart: CanonicalSam31VertexCompleteSourceQualificationCallStart
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  taskStore: CanonicalSam31GpuTaskStore
  repository: CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
  providerRoundTripDurationMilliseconds: number
  observedAt: string
}) {
  const runtime = await input.taskStore.rereadRuntimeResponse(
    input.attempt.invocationId,
  )
  if (runtime === null) {
    throw new Error('Complete-source prediction response is absent.')
  }
  const exact = assertCanonicalSam31GpuRuntimeResponse({
    request: input.task.runtimeRequest,
    response: runtime,
  })
  const digest = createHash('sha256')
    .update(canonicalSam31GpuWireStringify(exact)).digest('hex')
  if (input.prediction.runtimeStatus !== exact.status
    || input.prediction.responseRef.contentHash !== `sha256:${digest}`) {
    throw new Error('Complete-source prediction and response differ.')
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
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  callStart: CanonicalSam31VertexCompleteSourceQualificationCallStart
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  repository: CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
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
      contentHash:
        `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    },
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'private_response_reconciliation',
    providerRoundTripDurationMilliseconds: null,
    exactVertexPredictionWrapperReread: false,
    observedAt: input.observedAt })
}

async function persistTerminal(input: {
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  callStart: CanonicalSam31VertexCompleteSourceQualificationCallStart
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  repository: CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
  runtimeStatus: 'completed' | 'failed'
  runtimeResponseRef: EvidenceRef
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
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  callStart: CanonicalSam31VertexCompleteSourceQualificationCallStart
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  repository: CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
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
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  callStart: CanonicalSam31VertexCompleteSourceQualificationCallStart
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  repository: CanonicalSam31VertexCompleteSourceQualificationInvocationRepository
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
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt
  callStart: CanonicalSam31VertexCompleteSourceQualificationCallStart
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  disposition: 'completed' | 'failed'
    | 'not_executed_scale_from_zero_trigger'
    | 'outcome_unknown_requires_reconciliation'
  runtimeStatus: 'completed' | 'failed' | null
  runtimeResponseRef: EvidenceRef | null
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
      CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_RESULT_VERSION,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner',
    invocationPurpose: 'private_complete_source_pre_release_qualification',
    qualificationId: input.preparation.qualificationId,
    runOrdinal: input.preparation.runOrdinal,
    chunkOrdinal: input.preparation.chunkOrdinal,
    invocationId: input.attempt.invocationId,
    qualificationPreparationRef:
      input.attempt.qualificationPreparationRef,
    parentQualificationAdmissionRef:
      input.preparation.parentQualificationAdmissionRef,
    qualificationCandidateRef: input.preparation.qualificationCandidateRef,
    preparedChunkArtifactRef: input.preparation.preparedChunkArtifactRef,
    exactSourceRangeMappingRef: input.preparation.exactSourceRangeMappingRef,
    canonicalStartFrameInclusive:
      input.preparation.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: input.preparation.canonicalEndFrameInclusive,
    attemptRef: attemptRef(input.attempt),
    callStartRef: {
      id: `sam31-complete-source-call-start:${input.attempt.invocationId}`,
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
  return canonicalSam31VertexCompleteSourceQualificationResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function assertInvocationLineage(input: {
  request: { invocationId: string; qualificationPreparationRef: EvidenceRef;
    dispatchAdmissionDigestSha256: string }
  preparation: CanonicalSam31VertexCompleteSourceQualificationPreparation
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
}) {
  if (input.preparation.invocationId !== input.request.invocationId
    || !sameRef(
      createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
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
    || input.task.runtimeRequest.sourceMedia.canonicalSourceStartFrameInclusive
      !== input.preparation.canonicalStartFrameInclusive
    || input.task.runtimeRequest.sourceMedia.canonicalSourceEndFrameInclusive
      !== input.preparation.canonicalEndFrameInclusive
    || !sameRef(input.task.runtimeRequest.sourceMedia
      .gpuPreparedMaskProxyArtifactRef,
    input.preparation.preparedChunkArtifactRef)
    || input.task.runtimeRequest.dispatch.routeRole !==
      'a100_80gb_heavy_primary'
    || input.task.runtimeRequest.dispatch.accelerator !== 'nvidia_a100_80gb'
    || input.task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed
    || !input.task.runtimeRequest.dispatch.scaleFromZeroRequired
    || input.task.cloudJobCreated
    || input.task.customerCreditsMutated
    || input.task.productionAuthorityGranted) {
    throw new Error('Complete-source qualification invocation changed.')
  }
}

function exactResult(
  expected: CanonicalSam31VertexCompleteSourceQualificationResult,
  value: unknown,
) {
  const parsed =
    assertCanonicalSam31VertexCompleteSourceQualificationResult(value)
  if (parsed.resultHash !== expected.resultHash) {
    throw new Error('Complete-source qualification result reread changed.')
  }
  return parsed
}

function attemptRef(
  attempt: CanonicalSam31VertexCompleteSourceQualificationAttempt,
): EvidenceRef {
  return {
    id: `sam31-complete-source-attempt:${attempt.invocationId}`,
    version: 1,
    contentHash: `sha256:${attempt.attemptHash}`,
  }
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameAttemptLineage(
  left: CanonicalSam31VertexCompleteSourceQualificationAttempt,
  right: CanonicalSam31VertexCompleteSourceQualificationAttempt,
) {
  return stableAuthorityStringify(omit(left, ['attemptHash', 'consumedAt'])) ===
    stableAuthorityStringify(omit(right, ['attemptHash', 'consumedAt']))
}

function sameCallStartLineage(
  left: CanonicalSam31VertexCompleteSourceQualificationCallStart,
  right: CanonicalSam31VertexCompleteSourceQualificationCallStart,
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
    || end < start) {
    throw new Error('Complete-source qualification clock changed.')
  }
  return end - start
}
