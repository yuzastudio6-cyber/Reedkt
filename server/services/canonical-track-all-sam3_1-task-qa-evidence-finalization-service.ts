import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RESULT_VERSION,
  type TrackAllSam31TaskQaEvidenceFinalizationRequest,
  type TrackAllSam31TaskQaEvidenceFinalizationResult,
} from '../../src/types/track-all-sam3_1-task-qa-evidence-finalization'
import type {
  TrackAllSam31CaptionEvidenceRef,
} from '../../src/types/track-all-sam3_1-caption-evidence-finalization'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuExecutionEnvelope,
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuExecutionEnvelope,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobTerminal,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  parseCanonicalTrackAllSam31L4MaskQaMeasurement,
  parseCanonicalTrackAllSam31PrivateSceneReview,
  sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence,
  type CanonicalTrackAllSam31TaskQaRepository,
} from './canonical-track-all-sam3_1-task-qa-owner'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskContext,
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import type {
  CanonicalSam31GpuTaskContextRepository,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequest,
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponse,
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_CANDIDATE_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-task-qa-candidate-repository-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-task-qa-evidence-finalization-runtime-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_RESULT_VERSION =
  'canonical-track-all-sam3_1-l4-mask-qa-worker-result-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_VERSION =
  'canonical-track-all-sam3_1-l4-mask-qa-worker-result-v2' as const
export const CANONICAL_TRACK_ALL_SAM3_1_PRIVATE_REVIEW_RESULT_VERSION =
  'canonical-track-all-sam3_1-private-review-result-v1' as const

const PREFIX = 'private/track-all/sam3_1/v1/task-qa-candidates'
const MAX_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema: z.ZodType<TrackAllSam31CaptionEvidenceRef> = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()

const workerResultV1WithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_RESULT_VERSION,
  ),
  workerResultId: safeId,
  invocationId: safeId,
  workerServiceIdentityRef: refSchema,
  l4LaunchRef: refSchema,
  l4ExecutionEnvelopeRef: refSchema,
  l4TerminalRef: refSchema,
  measurement: z.unknown(),
  privateCreateOnlyWorkerOutput: z.literal(true),
  actualKorniaCudaAndOpenCvExecutionReportedByWorker: z.literal(true),
  callerOrBrowserOutputAccepted: z.literal(false),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
}).strict()
const workerResultV1Schema = workerResultV1WithoutDigestSchema.extend({
  workerResultDigestSha256: sha256,
}).strict()
export type CanonicalTrackAllSam31L4MaskQaWorkerResultV1 = z.infer<
  typeof workerResultV1Schema
>

const workerEvidenceResultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_VERSION,
  ),
  workerResultId: safeId,
  invocationId: safeId,
  workerServiceIdentityRef: refSchema,
  l4LaunchRef: refSchema,
  l4ExecutionEnvelopeRef: refSchema,
  l4TerminalRef: refSchema,
  workerRequest: z.unknown(),
  workerResponse: z.unknown(),
  privateCreateOnlyWorkerOutput: z.literal(true),
  fixedWorkerRequestAndResponseExactReread: z.literal(true),
  measurementCompiledOnlyByCanonicalBackend: z.literal(true),
  callerOrBrowserMeasurementAccepted: z.literal(false),
  callerOrBrowserOutputAccepted: z.literal(false),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
}).strict()
const workerEvidenceResultSchema = workerEvidenceResultWithoutDigestSchema
  .extend({ workerResultDigestSha256: sha256 }).strict()
export type CanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult = z.infer<
  typeof workerEvidenceResultSchema
>
export type CanonicalTrackAllSam31L4MaskQaWorkerResult =
  | CanonicalTrackAllSam31L4MaskQaWorkerResultV1
  | CanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult

const reviewResultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_PRIVATE_REVIEW_RESULT_VERSION,
  ),
  reviewResultId: safeId,
  invocationId: safeId,
  reviewerServiceIdentityRef: refSchema,
  workerResultRef: refSchema,
  review: z.unknown(),
  privateCreateOnlyReviewOutput: z.literal(true),
  completeIntervalPlaybackRereadByIndependentReviewOwner: z.literal(true),
  callerOrBrowserReviewAccepted: z.literal(false),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
}).strict()
const reviewResultSchema = reviewResultWithoutDigestSchema.extend({
  reviewResultDigestSha256: sha256,
}).strict()
export type CanonicalTrackAllSam31PrivateReviewResult = z.infer<
  typeof reviewResultSchema
>

const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_REQUEST_VERSION,
  ),
  requestId: safeId,
  invocationId: safeId,
  sam31RuntimeResultAdmissionRef: refSchema,
  l4MaskQaWorkerResultRef: refSchema,
  independentPrivateReviewResultRef: refSchema,
  byteFreeRequest: z.literal(true),
  browserOrCallerMeasurementAccepted: z.literal(false),
  browserOrCallerReviewAccepted: z.literal(false),
  callerCloudJobUsagePriceOrCostAccepted: z.literal(false),
  runtimeDispatchOrAssetMutationRequested: z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RESULT_VERSION,
  ),
  requestRef: refSchema,
  workspaceId: safeId,
  invocationId: safeId,
  l4MaskQaWorkerResultRef: refSchema,
  independentPrivateReviewResultRef: refSchema,
  l4MaskQaMeasurementRef: refSchema,
  privateSceneReviewRef: refSchema,
  disposition: z.literal('ready_for_caption_evidence_finalization'),
  authenticatedPrincipalVerified: z.literal(true),
  exactSamResultWorkerOutputLaunchEnvelopeTerminalAndReviewReread:
    z.literal(true),
  l4TerminalUsageAccountPriceAndCostReread: z.literal(true),
  workerStoppedAndScaleBackToZeroVerified: z.literal(true),
  createOnlyMeasurementAndReviewPersistedAndReread: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  runtimeExecutionPerformedByFinalizer: z.literal(false),
  assetMutationPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: sha256,
}).strict()
const runtimeInputSchema = z.object({
  authenticatedOwnerUserId: safeId,
  workspaceId: safeId,
  idempotencyKey: safeId,
  request: z.unknown(),
}).strict()

export interface CanonicalTrackAllSam31TaskQaCandidateRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_CANDIDATE_REPOSITORY_VERSION
  persistWorkerResultCreateOnly(input: {
    readonly result: CanonicalTrackAllSam31L4MaskQaWorkerResult
  }): Promise<'created' | 'identical_replay'>
  rereadWorkerResult(input: {
    readonly resultRef: TrackAllSam31CaptionEvidenceRef
  }): Promise<CanonicalTrackAllSam31L4MaskQaWorkerResult | null>
  persistReviewResultCreateOnly(input: {
    readonly result: CanonicalTrackAllSam31PrivateReviewResult
  }): Promise<'created' | 'identical_replay'>
  rereadReviewResult(input: {
    readonly resultRef: TrackAllSam31CaptionEvidenceRef
  }): Promise<CanonicalTrackAllSam31PrivateReviewResult | null>
}

export interface CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RUNTIME_VERSION
  readonly acceptsRawMeasurementReviewMediaOrCloudClaims: false
  readonly performsRuntimeAssetQaBillingOrDeliveryMutation: false
  finalizeTaskQaEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly idempotencyKey: string
    readonly request: unknown
  }): Promise<TrackAllSam31TaskQaEvidenceFinalizationResult>
}

export function sealCanonicalTrackAllSam31L4MaskQaWorkerResult(
  value: z.input<typeof workerResultV1WithoutDigestSchema>,
): CanonicalTrackAllSam31L4MaskQaWorkerResultV1 {
  assertPlainSerializedData(value, 'track_all_l4_mask_qa_worker_result_input')
  const payload = workerResultV1WithoutDigestSchema.parse(value)
  parseCanonicalTrackAllSam31L4MaskQaMeasurement(payload.measurement)
  return parseWorkerResult({
    ...payload,
    workerResultDigestSha256: sha256AuthorityValue(payload),
  }) as CanonicalTrackAllSam31L4MaskQaWorkerResultV1
}

export function sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult(
  value: z.input<typeof workerEvidenceResultWithoutDigestSchema>,
): CanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult {
  assertPlainSerializedData(value,
    'track_all_l4_mask_qa_worker_evidence_result_input')
  const payload = workerEvidenceResultWithoutDigestSchema.parse(value)
  assertFixedWorkerEvidenceResult(payload)
  return parseWorkerResult({
    ...payload,
    workerResultDigestSha256: sha256AuthorityValue(payload),
  }) as CanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult
}

export function sealCanonicalTrackAllSam31PrivateReviewResult(
  value: z.input<typeof reviewResultWithoutDigestSchema>,
): CanonicalTrackAllSam31PrivateReviewResult {
  assertPlainSerializedData(value, 'track_all_private_review_result_input')
  const payload = reviewResultWithoutDigestSchema.parse(value)
  parseCanonicalTrackAllSam31PrivateSceneReview(payload.review)
  return parseReviewResult({
    ...payload,
    reviewResultDigestSha256: sha256AuthorityValue(payload),
  })
}

export function buildTrackAllSam31TaskQaEvidenceFinalizationRequest(input: {
  readonly requestId: string
  readonly invocationId: string
  readonly sam31RuntimeResultAdmissionRef: TrackAllSam31CaptionEvidenceRef
  readonly l4MaskQaWorkerResultRef: TrackAllSam31CaptionEvidenceRef
  readonly independentPrivateReviewResultRef:
    TrackAllSam31CaptionEvidenceRef
}): TrackAllSam31TaskQaEvidenceFinalizationRequest {
  assertPlainSerializedData(input, 'track_all_task_qa_finalization_input')
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_REQUEST_VERSION,
    ...structuredClone(input),
    byteFreeRequest: true,
    browserOrCallerMeasurementAccepted: false,
    browserOrCallerReviewAccepted: false,
    callerCloudJobUsagePriceOrCostAccepted: false,
    runtimeDispatchOrAssetMutationRequested: false,
  })
  return Object.freeze(requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31TaskQaEvidenceFinalizationRequest(
  value: unknown,
): TrackAllSam31TaskQaEvidenceFinalizationRequest {
  assertPlainSerializedData(value, 'track_all_task_qa_finalization_request')
  const request = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All task-QA finalization digest is invalid.')
  }
  return structuredClone(request)
}

export function parseTrackAllSam31TaskQaEvidenceFinalizationResult(
  value: unknown,
): TrackAllSam31TaskQaEvidenceFinalizationResult {
  assertPlainSerializedData(value, 'track_all_task_qa_finalization_result')
  const result = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = result
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All task-QA result digest is invalid.')
  }
  return structuredClone(result)
}

export function createCanonicalTrackAllSam31TaskQaCandidateRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalTrackAllSam31TaskQaCandidateRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_CANDIDATE_REPOSITORY_VERSION,
    persistWorkerResultCreateOnly: ({ result }: {
      readonly result: CanonicalTrackAllSam31L4MaskQaWorkerResult
    }) => persist({
      port: input.objectPort,
      path: candidatePath(prefix, 'workers', workerResultRef(result)),
      value: parseWorkerResult(result),
      parse: parseWorkerResult,
    }),
    rereadWorkerResult: ({ resultRef }: {
      readonly resultRef: TrackAllSam31CaptionEvidenceRef
    }) => reread({
      port: input.objectPort,
      path: candidatePath(prefix, 'workers', refSchema.parse(resultRef)),
      parse: parseWorkerResult,
    }),
    persistReviewResultCreateOnly: ({ result }: {
      readonly result: CanonicalTrackAllSam31PrivateReviewResult
    }) => persist({
      port: input.objectPort,
      path: candidatePath(prefix, 'reviews', reviewResultRef(result)),
      value: parseReviewResult(result),
      parse: parseReviewResult,
    }),
    rereadReviewResult: ({ resultRef }: {
      readonly resultRef: TrackAllSam31CaptionEvidenceRef
    }) => reread({
      port: input.objectPort,
      path: candidatePath(prefix, 'reviews', refSchema.parse(resultRef)),
      parse: parseReviewResult,
    }),
  })
}

export function createCanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntime(
  input: {
    readonly candidateRepository:
      CanonicalTrackAllSam31TaskQaCandidateRepository
    readonly lifecycleReadPort: Pick<
      CanonicalProfessionalGpuDurableLifecycleStore,
      'rereadExecutionEnvelope' | 'rereadLaunchRecord' |
      'rereadTerminalRecord'
    >
    readonly sam31ResultStore: Pick<
      CanonicalSam31GpuRuntimeResultStore,
      'rereadResultAdmission'
    >
    readonly sam31TaskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
    readonly taskContextRepository: Pick<
      CanonicalSam31GpuTaskContextRepository,
      'rereadTaskContext'
    >
    readonly taskQaRepository: Pick<
      CanonicalTrackAllSam31TaskQaRepository,
      'persistMeasurementCreateOnly' | 'rereadMeasurement' |
      'persistReviewCreateOnly' | 'rereadReview'
    >
  },
): CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort {
  assertRuntimePorts(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RUNTIME_VERSION,
    acceptsRawMeasurementReviewMediaOrCloudClaims: false as const,
    performsRuntimeAssetQaBillingOrDeliveryMutation: false as const,
    async finalizeTaskQaEvidence(untrusted: {
      readonly authenticatedOwnerUserId: string
      readonly workspaceId: string
      readonly idempotencyKey: string
      readonly request: unknown
    }) {
      assertPlainSerializedData(untrusted,
        'track_all_task_qa_finalization_runtime_input')
      const runtimeInput = runtimeInputSchema.parse(untrusted)
      const request = parseTrackAllSam31TaskQaEvidenceFinalizationRequest(
        runtimeInput.request,
      )
      if (request.requestId !== runtimeInput.idempotencyKey) {
        throw new TypeError(
          'Track All task-QA finalization differs from its idempotency key.',
        )
      }
      const samResult = assertCanonicalSam31GpuRuntimeResultAdmission(
        await input.sam31ResultStore.rereadResultAdmission(
          request.invocationId,
        ),
      )
      const samTask = assertCanonicalSam31GpuTaskRecord(
        await input.sam31TaskStore.rereadTask(request.invocationId),
      )
      const samTaskContext = assertCanonicalSam31GpuTaskContext(
        await input.taskContextRepository.rereadTaskContext({
          taskContextRef: samTask.taskContextRef,
        }),
      )
      if (!sameRef(request.sam31RuntimeResultAdmissionRef, {
        id: samResult.resultAdmissionId,
        version: samResult.schemaVersion,
        contentHash: samResult.resultAdmissionHash,
      })) throw new TypeError('Track All task-QA SAM result ref is stale.')
      const workerResult = await input.candidateRepository.rereadWorkerResult({
        resultRef: request.l4MaskQaWorkerResultRef,
      })
      const reviewResult = await input.candidateRepository.rereadReviewResult({
        resultRef: request.independentPrivateReviewResultRef,
      })
      if (!workerResult || !reviewResult) throw new TypeError(
        'Track All task-QA worker or independent-review result is unavailable.',
      )
      assertCandidateRefs({ request, workerResult, reviewResult })
      const launch = assertCanonicalProfessionalGpuJobLaunch(
        await input.lifecycleReadPort.rereadLaunchRecord({
          launchRecordId: workerResult.l4LaunchRef.id,
        }),
      )
      const envelope = assertCanonicalProfessionalGpuExecutionEnvelope(
        await input.lifecycleReadPort.rereadExecutionEnvelope({
          envelopeId: workerResult.l4ExecutionEnvelopeRef.id,
        }),
      )
      const terminal = assertCanonicalProfessionalGpuJobTerminal(
        await input.lifecycleReadPort.rereadTerminalRecord({
          terminalRecordId: workerResult.l4TerminalRef.id,
        }),
      )
      if (workerResult.schemaVersion ===
        CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_RESULT_VERSION) {
        throw new TypeError(
          'Historical Track All worker measurement v1 is read-only and cannot finalize fresh QA evidence.',
        )
      }
      const measurement =
        compileCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerResult({
          samTask,
          samTaskContext,
          samResult,
          workerResult,
          launch,
          envelope,
          terminal,
        })
      const review = parseCanonicalTrackAllSam31PrivateSceneReview(
        reviewResult.review,
      )
      assertExactLineage({
        authenticatedOwnerUserId: runtimeInput.authenticatedOwnerUserId,
        workspaceId: runtimeInput.workspaceId,
        request,
        samTask,
        samTaskContext,
        samResult,
        workerResult,
        reviewResult,
        measurement,
        review,
        launch,
        envelope,
        terminal,
      })
      await input.taskQaRepository.persistMeasurementCreateOnly({
        measurement,
      })
      const measurementReference = measurementRef(measurement)
      const measurementReread =
        await input.taskQaRepository.rereadMeasurement({
          measurementRef: measurementReference,
        })
      if (!measurementReread || measurementReread.measurementDigestSha256
        !== measurement.measurementDigestSha256) throw new TypeError(
        'Track All L4 measurement create-only reread failed.',
      )
      await input.taskQaRepository.persistReviewCreateOnly({ review })
      const reviewReference = reviewRef(review)
      const reviewReread = await input.taskQaRepository.rereadReview({
        reviewRef: reviewReference,
      })
      if (!reviewReread || reviewReread.reviewDigestSha256
        !== review.reviewDigestSha256) throw new TypeError(
        'Track All private review create-only reread failed.',
      )
      const payload = resultWithoutDigestSchema.parse({
        schemaVersion:
          TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RESULT_VERSION,
        requestRef: {
          id: request.requestId,
          version: request.schemaVersion,
          contentHash: request.requestDigestSha256,
        },
        workspaceId: runtimeInput.workspaceId,
        invocationId: request.invocationId,
        l4MaskQaWorkerResultRef: workerResultRef(workerResult),
        independentPrivateReviewResultRef: reviewResultRef(reviewResult),
        l4MaskQaMeasurementRef: measurementReference,
        privateSceneReviewRef: reviewReference,
        disposition: 'ready_for_caption_evidence_finalization',
        authenticatedPrincipalVerified: true,
        exactSamResultWorkerOutputLaunchEnvelopeTerminalAndReviewReread:
          true,
        l4TerminalUsageAccountPriceAndCostReread: true,
        workerStoppedAndScaleBackToZeroVerified: true,
        createOnlyMeasurementAndReviewPersistedAndReread: true,
        browserLocalStateUsed: false,
        runtimeExecutionPerformedByFinalizer: false,
        assetMutationPerformed: false,
        customerCreditsMutated: false,
        finalQaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      })
      return parseTrackAllSam31TaskQaEvidenceFinalizationResult({
        ...payload,
        resultDigestSha256: sha256AuthorityValue(payload),
      })
    },
  })
}

function parseWorkerResult(
  value: unknown,
): CanonicalTrackAllSam31L4MaskQaWorkerResult {
  assertPlainSerializedData(value, 'track_all_l4_mask_qa_worker_result')
  const version = z.object({ schemaVersion: z.string() }).passthrough()
    .parse(value).schemaVersion
  const result = version ===
    CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_RESULT_VERSION
    ? workerResultV1Schema.parse(value)
    : version ===
      CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_VERSION
      ? workerEvidenceResultSchema.parse(value)
      : (() => { throw new TypeError(
        'Track All L4 worker result version is unsupported.',
      ) })()
  const { workerResultDigestSha256, ...payload } = result
  if (workerResultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 worker result digest is invalid.')
  }
  if (result.schemaVersion ===
    CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_RESULT_VERSION) {
    parseCanonicalTrackAllSam31L4MaskQaMeasurement(result.measurement)
  } else {
    assertFixedWorkerEvidenceResult(result)
  }
  return structuredClone(result)
}

function assertFixedWorkerEvidenceResult(value: {
  readonly invocationId: string
  readonly l4ExecutionEnvelopeRef: TrackAllSam31CaptionEvidenceRef
  readonly workerRequest: unknown
  readonly workerResponse: unknown
}): void {
  const request = assertCanonicalTrackAllSam31L4TaskQaWorkerRequest(
    value.workerRequest,
  )
  const response = assertCanonicalTrackAllSam31L4TaskQaWorkerResponse(
    value.workerResponse,
  )
  if (
    request.invocationId !== value.invocationId
    || response.status !== 'completed'
    || response.requestBindingSha256 !== request.requestBindingSha256
    || request.l4ExecutionEnvelopeRef.id !==
      value.l4ExecutionEnvelopeRef.id
    || stripSha(request.l4ExecutionEnvelopeRef.contentHash) !==
      value.l4ExecutionEnvelopeRef.contentHash
  ) throw new TypeError(
    'Track All L4 fixed worker evidence lost request, response, or envelope lineage.',
  )
}

function parseReviewResult(
  value: unknown,
): CanonicalTrackAllSam31PrivateReviewResult {
  assertPlainSerializedData(value, 'track_all_private_review_result')
  const result = reviewResultSchema.parse(value)
  const { reviewResultDigestSha256, ...payload } = result
  if (reviewResultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All private review result digest is invalid.')
  }
  parseCanonicalTrackAllSam31PrivateSceneReview(result.review)
  return structuredClone(result)
}

/**
 * Compiles the canonical task-QA measurement from the exact fixed worker
 * request/response and server-reread SAM/L4 records. The private worker never
 * supplies the canonical scope, pricing, cost, stop, or measurement record.
 */
export function compileCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerResult(
  input: {
    readonly samTask: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
    readonly samTaskContext: ReturnType<
      typeof assertCanonicalSam31GpuTaskContext
    >
    readonly samResult: ReturnType<
      typeof assertCanonicalSam31GpuRuntimeResultAdmission
    >
    readonly workerResult: CanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult
    readonly launch: CanonicalProfessionalGpuJobLaunch
    readonly envelope: CanonicalProfessionalGpuExecutionEnvelope
    readonly terminal: CanonicalProfessionalGpuJobTerminal
  },
) {
  assertPlainSerializedData(input,
    'track_all_l4_measurement_compilation_input')
  const task = assertCanonicalSam31GpuTaskRecord(input.samTask)
  const context = assertCanonicalSam31GpuTaskContext(input.samTaskContext)
  const samResult = assertCanonicalSam31GpuRuntimeResultAdmission(
    input.samResult,
  )
  const workerResult = parseWorkerResult(input.workerResult)
  if (workerResult.schemaVersion !==
    CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_VERSION) {
    throw new TypeError('Track All fixed worker evidence v2 is required.')
  }
  const launch = assertCanonicalProfessionalGpuJobLaunch(input.launch)
  const envelope = assertCanonicalProfessionalGpuExecutionEnvelope(
    input.envelope,
  )
  const terminal = assertCanonicalProfessionalGpuJobTerminal(input.terminal)
  const workerRequest = assertCanonicalTrackAllSam31L4TaskQaWorkerRequest(
    workerResult.workerRequest,
  )
  const workerResponse = assertCanonicalTrackAllSam31L4TaskQaWorkerResponse(
    workerResult.workerResponse,
  )
  const source = task.runtimeRequest.sourceMedia
  const scope = task.runtimeRequest.scope
  const canonicalRange = {
    startFrame: source.canonicalSourceStartFrameInclusive,
    endFrameExclusive: source.canonicalSourceEndFrameInclusive + 1,
  }
  const taskReference = lifecycleNumericRef(
    task.taskId,
    task.taskRecordHash,
  )
  const resultReference = lifecycleNumericRef(
    samResult.resultAdmissionId,
    samResult.resultAdmissionHash,
  )
  const exactWorkerInput =
    workerRequest.invocationId === task.invocationId
    && workerRequest.sam31RuntimeRequestBindingSha256 ===
      task.runtimeRequest.requestBindingSha256
    && samePrefixedRef(workerRequest.sam31TaskRef, taskReference)
    && samePrefixedRef(
      workerRequest.sam31RuntimeResultAdmissionRef,
      resultReference,
    )
    && samePrefixedRef(workerRequest.sam31MaskManifestRef,
      samResult.manifestRef)
    && samePrefixedRef(workerRequest.l4ExecutionEnvelopeRef,
      envelopeRef(envelope))
    && samePrefixedRef(workerRequest.approvedWorkItemRef,
      envelope.approvedWorkItemRef)
    && samePrefixedRef(workerRequest.workerLeaseRef,
      envelope.workerLeaseRef)
    && samePrefixedRef(workerRequest.executionAttemptRef,
      envelope.executionAttemptRef)
    && samePrefixedRef(workerRequest.sourceFrameMappingRef,
      source.sourceFrameRangeMappingRef)
    && samePrefixedRef(workerRequest.confirmedOutputFrameRef,
      context.confirmedOutputFrameRef)
    && workerRequest.sourceWidth === source.width
    && workerRequest.sourceHeight === source.height
    && workerRequest.maskFrameRange.startFrame === 0
    && workerRequest.maskFrameRange.endFrameExclusive ===
      source.decodedFrameCount
    && workerRequest.expectedMaskManifestSha256 ===
      stripSha(samResult.manifestRef.contentHash)
    && workerRequest.expectedMaskPngCount === samResult.maskFileCount
    && workerRequest.subjects.every((subject) =>
      stableAuthorityStringify(subject.canonicalFrameRange)
        === stableAuthorityStringify(canonicalRange)
      && samePrefixedRef(subject.trackManifestRef, samResult.manifestRef))
  const exactCanonicalContext = task.taskContextRef.id ===
      context.taskContextRef.id
    && task.taskContextRef.contentHash === context.taskContextRef.contentHash
    && scope.editPlanVersionId === context.editPlanVersionId
    && scope.outputId === context.outputId
    && scope.sceneId === context.sceneId
    && stableAuthorityStringify(context.sourceMedia) ===
      stableAuthorityStringify(task.runtimeRequest.sourceMedia)
    && scope.approvedPlanSnapshotId === envelope.approvedSnapshotRef.id
    && scope.approvedPlanSnapshotHash ===
      stripSha(envelope.approvedSnapshotRef.contentHash)
    && samePrefixedRef(context.confirmedOutputFrameRef,
      envelope.confirmedOutputFrameRef)
    && samePrefixedRef(scope.masterTimingRef, envelope.masterTimingRef)
  const exactLifecycle = workerResult.invocationId === task.invocationId
    && sameRef(workerResult.l4LaunchRef, lifecycleRef(
      launch.launchRecordId, launch.schemaVersion, launch.launchHash,
    ))
    && sameRef(workerResult.l4ExecutionEnvelopeRef, lifecycleRef(
      envelope.envelopeId, envelope.schemaVersion, envelope.envelopeHash,
    ))
    && sameRef(workerResult.l4TerminalRef, lifecycleRef(
      terminal.terminalRecordId, terminal.schemaVersion, terminal.terminalHash,
    ))
    && samePrefixedRef(launch.executionEnvelopeRef, envelopeRef(envelope))
    && samePrefixedRef(launch.admissionRef, envelope.admissionRef)
    && samePrefixedRef(
      launch.admissionConsumptionRef,
      envelope.admissionConsumptionRef,
    )
    && samePrefixedRef(launch.runtimeReleaseRef, envelope.runtimeReleaseRef)
    && launch.toolId === envelope.toolId
    && launch.operationId === envelope.operationId
    && launch.routeId === envelope.routeId
    && launch.immutableImageDigest === envelope.immutableImageDigest
    && samePrefixedRef(
      envelope.fixedServerTaskContractRef,
      canonicalTrackAllSam31L4TaskQaFixedTaskContractRef(),
    )
    && samePrefixedRef(terminal.launchRef, launchRef(launch))
    && samePrefixedRef(terminal.admissionRef, launch.admissionRef)
    && sameNullablePrefixedRef(
      terminal.cloudJobExecutionRef,
      launch.cloudJobExecutionRef,
    )
    && launch.toolId === 'kornia'
    && launch.operationId === 'tool.kornia.refine_mask.v1'
    && launch.routeId === 'l4_standard_primary'
    && launch.executionTarget === 'google_cloud_run_l4_job'
    && launch.accelerator === 'nvidia_l4'
    && launch.launchDisposition === 'job_created'
    && envelope.toolId === 'kornia'
    && envelope.operationId === 'tool.kornia.refine_mask.v1'
    && envelope.routeId === 'l4_standard_primary'
    && !envelope.runtimeDownloadAllowed
    && !envelope.cpuOnlySubstantiveExecutionAllowed
    && terminal.terminalOutcome === 'completed'
    && terminal.providerInferenceOrSubstantiveWorkOutcome === 'executed'
    && terminal.cloudJobTerminalStateReread
    && terminal.workerStoppedVerified
    && terminal.activeGpuInstancesAfterTerminalObservation === 0
    && terminal.exactPlatformUsageAndAccountPriceReread
    && terminal.costReceiptPersistedBeforeSettlement
  if (!exactWorkerInput || !exactCanonicalContext || !exactLifecycle) {
    throw new TypeError(
      'Track All fixed worker evidence crossed SAM, scope, frame, or L4 lineage.',
    )
  }
  const output = workerResponse.outputSummary
  if (workerResponse.status !== 'completed' || output === null) {
    throw new TypeError('Track All fixed L4 worker did not complete.')
  }
  const canonicalTaskRef = domainRecordRef(
    task.taskId,
    task.schemaVersion,
    task.taskRecordHash,
  )
  const canonicalResultRef = domainRecordRef(
    samResult.resultAdmissionId,
    samResult.schemaVersion,
    samResult.resultAdmissionHash,
  )
  const canonicalEnvelopeRef = domainRecordRef(
    envelope.envelopeId,
    envelope.schemaVersion,
    envelope.envelopeHash,
  )
  const measurementId =
    `track-all-l4-measurement-${workerResult.workerResultDigestSha256.slice(0, 32)}`
  return sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence({
    measurementId,
    canonicalSam31TaskRef: canonicalTaskRef,
    canonicalSam31RuntimeResultAdmissionRef: canonicalResultRef,
    canonicalSam31MaskSequenceArtifactRef:
      domainRef(samResult.maskSequenceArtifactRef),
    canonicalL4ExecutionEnvelopeRef: canonicalEnvelopeRef,
    canonicalScope: {
      ownerUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      planVersionId: context.editPlanVersionId,
      approvedSnapshotRef: domainRef(envelope.approvedSnapshotRef),
      outputId: context.outputId,
      sceneId: context.sceneId,
      authorizedFrameRanges: [canonicalRange],
    },
    sourcePrivateArtifactRef: domainRef(source.finalizedSourceArtifactRef),
    requestedRange: canonicalRange,
    l4QaExecution: {
      routeId: 'l4_standard_primary',
      gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
      accelerator: 'nvidia_l4',
      approvedWorkItemRef: domainRef(envelope.approvedWorkItemRef),
      workerLeaseRef: domainRef(envelope.workerLeaseRef),
      executionAttemptRef: domainRef(envelope.executionAttemptRef),
      currentAccountPriceAuthorityRef:
        domainRef(terminal.currentAccountPriceAuthorityRef),
      workerUsageEvidenceRef: domainRef(terminal.workerUsageEvidenceRef),
      attemptCostReceiptRef: domainRef(terminal.attemptCostReceiptRef),
      korniaCudaExecutionEvidenceRef: domainRecordRef(
        `track-all-l4-kornia-${workerResponse.responseBindingSha256.slice(0, 32)}`,
        workerResponse.schemaVersion,
        output.korniaCudaExecutionDigestSha256,
      ),
      opencvCrosscheckExecutionEvidenceRef: domainRecordRef(
        `track-all-l4-opencv-${workerResponse.responseBindingSha256.slice(0, 32)}`,
        workerResponse.schemaVersion,
        output.opencvCudaCrosscheckExecutionDigestSha256,
      ),
      actualL4GpuExecutionObserved: true,
      actualKorniaCudaKernelExecutionObserved: true,
      actualOpenCvCrosscheckExecutionObserved: true,
      cpuOnlySubstantiveMaskQaUsed: false,
      userTriggeredAfterApprovedWork: true,
      terminalWorkerStoppedAndScaleBackToZeroVerified: true,
      exactAccountEffectiveAttemptCostPersisted: true,
    },
    workerRequest,
    workerResponse,
    measuredAt: terminal.observedAt,
  })
}

function assertCandidateRefs(input: {
  request: TrackAllSam31TaskQaEvidenceFinalizationRequest
  workerResult: CanonicalTrackAllSam31L4MaskQaWorkerResult
  reviewResult: CanonicalTrackAllSam31PrivateReviewResult
}): void {
  if (
    !sameRef(input.request.l4MaskQaWorkerResultRef,
      workerResultRef(input.workerResult))
    || !sameRef(input.request.independentPrivateReviewResultRef,
      reviewResultRef(input.reviewResult))
    || !sameRef(input.reviewResult.workerResultRef,
      workerResultRef(input.workerResult))
  ) throw new TypeError('Track All task-QA candidate refs are inconsistent.')
}

function assertExactLineage(input: {
  authenticatedOwnerUserId: string
  workspaceId: string
  request: TrackAllSam31TaskQaEvidenceFinalizationRequest
  samTask: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  samTaskContext: ReturnType<typeof assertCanonicalSam31GpuTaskContext>
  samResult: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>
  workerResult: CanonicalTrackAllSam31L4MaskQaWorkerResult
  reviewResult: CanonicalTrackAllSam31PrivateReviewResult
  measurement: ReturnType<
    typeof parseCanonicalTrackAllSam31L4MaskQaMeasurement
  >
  review: ReturnType<typeof parseCanonicalTrackAllSam31PrivateSceneReview>
  launch: CanonicalProfessionalGpuJobLaunch
  envelope: CanonicalProfessionalGpuExecutionEnvelope
  terminal: CanonicalProfessionalGpuJobTerminal
}): void {
  const {
    request, samTask, samTaskContext, samResult, workerResult, reviewResult,
    measurement, review, launch, envelope, terminal,
  } = input
  const l4 = measurement.l4QaExecution
  const samTaskReference = {
    id: samTask.taskId,
    version: samTask.schemaVersion,
    contentHash: samTask.taskRecordHash,
  }
  const measuredSubjectEvidenceIds = measurement.subjectEvidence
    .map((item) => item.subjectEvidenceId)
    .sort(compareUtf16)
  const reviewedSubjectEvidenceIds = [...review.reviewedSubjectEvidenceIds]
    .sort(compareUtf16)
  const exactLifecycle = sameRef(workerResult.l4LaunchRef, lifecycleRef(
    launch.launchRecordId, launch.schemaVersion, launch.launchHash,
  ))
    && sameRef(workerResult.l4ExecutionEnvelopeRef, lifecycleRef(
      envelope.envelopeId, envelope.schemaVersion, envelope.envelopeHash,
    ))
    && sameRef(workerResult.l4TerminalRef, lifecycleRef(
      terminal.terminalRecordId, terminal.schemaVersion, terminal.terminalHash,
    ))
    && samePrefixedRef(launch.executionEnvelopeRef, envelopeRef(envelope))
    && samePrefixedRef(launch.admissionRef, envelope.admissionRef)
    && samePrefixedRef(
      launch.admissionConsumptionRef,
      envelope.admissionConsumptionRef,
    )
    && samePrefixedRef(launch.runtimeReleaseRef, envelope.runtimeReleaseRef)
    && launch.toolId === envelope.toolId
    && launch.operationId === envelope.operationId
    && launch.routeId === envelope.routeId
    && launch.immutableImageDigest === envelope.immutableImageDigest
    && samePrefixedRef(terminal.launchRef, launchRef(launch))
    && samePrefixedRef(terminal.admissionRef, launch.admissionRef)
    && sameNullablePrefixedRef(
      terminal.cloudJobExecutionRef,
      launch.cloudJobExecutionRef,
    )
  const exactL4 = launch.toolId === 'kornia'
    && launch.operationId === 'tool.kornia.refine_mask.v1'
    && launch.routeId === 'l4_standard_primary'
    && launch.executionTarget === 'google_cloud_run_l4_job'
    && launch.accelerator === 'nvidia_l4'
    && launch.launchDisposition === 'job_created'
    && launch.cloudJobExecutionRef !== null
    && envelope.toolId === 'kornia'
    && envelope.operationId === 'tool.kornia.refine_mask.v1'
    && envelope.routeId === 'l4_standard_primary'
    && envelope.runtimeDownloadAllowed === false
    && envelope.cpuOnlySubstantiveExecutionAllowed === false
    && terminal.terminalOutcome === 'completed'
    && terminal.providerInferenceOrSubstantiveWorkOutcome === 'executed'
    && terminal.cloudJobTerminalStateReread
    && terminal.workerStoppedVerified
    && terminal.activeGpuInstancesAfterTerminalObservation === 0
    && terminal.exactPlatformUsageAndAccountPriceReread
    && terminal.costReceiptPersistedBeforeSettlement
  if (
    input.authenticatedOwnerUserId !== measurement.canonicalScope.ownerUserId
    || input.workspaceId !== measurement.canonicalScope.workspaceId
    || request.invocationId !== workerResult.invocationId
    || request.invocationId !== reviewResult.invocationId
    || request.invocationId !== measurement.invocationId
    || request.invocationId !== samTask.invocationId
    || samTask.taskContextRef.id !== samTaskContext.taskContextRef.id
    || samTask.taskContextRef.contentHash !==
      samTaskContext.taskContextRef.contentHash
    || request.invocationId !== samResult.executionEnvelopeRef.id
    || !sameRef(measurement.sam31TaskRef, samTaskReference)
    || !sameRef(review.sam31TaskRef, samTaskReference)
    || !samePrefixedRef(samTask.executionEnvelopeRef,
      samResult.executionEnvelopeRef)
    || !samePrefixedRef(samResult.taskRef, {
      id: samTask.taskId,
      version: 1,
      contentHash: `sha256:${samTask.taskRecordHash}`,
    })
    || !sameRef(request.sam31RuntimeResultAdmissionRef,
      measurement.sam31RuntimeResultAdmissionRef)
    || !sameRef(request.sam31RuntimeResultAdmissionRef,
      review.sam31RuntimeResultAdmissionRef)
    || !sameRef(review.measurementRef, measurementRef(measurement))
    || stableAuthorityStringify(review.canonicalScope)
      !== stableAuthorityStringify(measurement.canonicalScope)
    || stableAuthorityStringify(review.requestedRange)
      !== stableAuthorityStringify(measurement.requestedRange)
    || stableAuthorityStringify(reviewedSubjectEvidenceIds)
      !== stableAuthorityStringify(measuredSubjectEvidenceIds)
    || !sameRef(review.reviewerIdentityRef,
      reviewResult.reviewerServiceIdentityRef)
    || sameRef(workerResult.workerServiceIdentityRef,
      reviewResult.reviewerServiceIdentityRef)
    || !exactLifecycle
    || !exactL4
    || !sameRef(l4.approvedWorkItemRef,
      domainRef(envelope.approvedWorkItemRef))
    || !sameRef(l4.workerLeaseRef, domainRef(envelope.workerLeaseRef))
    || !sameRef(l4.executionAttemptRef,
      domainRef(envelope.executionAttemptRef))
    || !sameRef(l4.currentAccountPriceAuthorityRef,
      domainRef(terminal.currentAccountPriceAuthorityRef))
    || !sameRef(l4.workerUsageEvidenceRef,
      domainRef(terminal.workerUsageEvidenceRef))
    || !sameRef(l4.attemptCostReceiptRef,
      domainRef(terminal.attemptCostReceiptRef))
    || Date.parse(terminal.observedAt) < Date.parse(measurement.measuredAt)
    || Date.parse(review.reviewedAt) < Date.parse(terminal.observedAt)
  ) throw new TypeError(
    'Track All task-QA evidence lost worker, lifecycle, cost, or review lineage.',
  )
}

function workerResultRef(
  value: CanonicalTrackAllSam31L4MaskQaWorkerResult,
): TrackAllSam31CaptionEvidenceRef {
  return {
    id: value.workerResultId,
    version: value.schemaVersion,
    contentHash: value.workerResultDigestSha256,
  }
}

function reviewResultRef(
  value: CanonicalTrackAllSam31PrivateReviewResult,
): TrackAllSam31CaptionEvidenceRef {
  return {
    id: value.reviewResultId,
    version: value.schemaVersion,
    contentHash: value.reviewResultDigestSha256,
  }
}

function measurementRef(value: ReturnType<
  typeof parseCanonicalTrackAllSam31L4MaskQaMeasurement
>): TrackAllSam31CaptionEvidenceRef {
  return {
    id: value.measurementId,
    version: value.schemaVersion,
    contentHash: value.measurementDigestSha256,
  }
}

function reviewRef(value: ReturnType<
  typeof parseCanonicalTrackAllSam31PrivateSceneReview
>): TrackAllSam31CaptionEvidenceRef {
  return {
    id: value.reviewId,
    version: value.schemaVersion,
    contentHash: value.reviewDigestSha256,
  }
}

function lifecycleRef(
  id: string,
  version: string,
  contentHash: string,
): TrackAllSam31CaptionEvidenceRef {
  return { id, version, contentHash }
}

function domainRef(value: {
  id: string
  version: number
  contentHash: string
}): TrackAllSam31CaptionEvidenceRef {
  return {
    id: value.id,
    version: String(value.version),
    contentHash: value.contentHash.replace(/^sha256:/u, ''),
  }
}

function domainRecordRef(
  id: string,
  version: string,
  contentHash: string,
): TrackAllSam31CaptionEvidenceRef {
  return refSchema.parse({ id, version, contentHash: stripSha(contentHash) })
}

function lifecycleNumericRef(id: string, contentHash: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${stripSha(contentHash)}`,
  }
}

function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function launchRef(value: CanonicalProfessionalGpuJobLaunch) {
  return {
    id: value.launchRecordId,
    version: 1,
    contentHash: `sha256:${value.launchHash}`,
  }
}

function envelopeRef(value: CanonicalProfessionalGpuExecutionEnvelope) {
  return {
    id: value.envelopeId,
    version: 1,
    contentHash: `sha256:${value.envelopeHash}`,
  }
}

function sameRef(
  left: TrackAllSam31CaptionEvidenceRef,
  right: TrackAllSam31CaptionEvidenceRef,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function samePrefixedRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameNullablePrefixedRef(
  left: { id: string; version: number; contentHash: string } | null,
  right: { id: string; version: number; contentHash: string } | null,
): boolean {
  return left === null || right === null
    ? left === right
    : samePrefixedRef(left, right)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function candidatePath(
  prefix: string,
  kind: string,
  reference: TrackAllSam31CaptionEvidenceRef,
): string {
  const identity = stableAuthorityStringify(refSchema.parse(reference))
  return `${prefix}/${kind}/${hash(Buffer.from(identity, 'utf8'))}.json`
}

async function persist<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  value: T
  parse: (value: unknown) => T
}): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_BYTES) {
    throw new TypeError('Track All task-QA candidate byte size is invalid.')
  }
  const status = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: hash(body),
  })
  const rereadValue = await reread({
    port: input.port,
    path: input.path,
    parse: input.parse,
  })
  if (!rereadValue || stableAuthorityStringify(rereadValue)
    !== stableAuthorityStringify(input.value)) throw new TypeError(
    'Track All task-QA candidate create-only reread changed.',
  )
  return status === 'created' ? 'created' : 'identical_replay'
}

async function reread<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_BYTES) {
    throw new TypeError('Track All task-QA candidate byte size is invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new TypeError('Track All task-QA candidate JSON is invalid.')
  }
  return input.parse(value)
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizePrefix(value: string): string {
  const prefix = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.length > 400 || prefix.includes('..')
    || prefix.includes('\\') || prefix.split('/').some((item) =>
      !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(item))) {
    throw new TypeError('Track All task-QA candidate prefix is invalid.')
  }
  return prefix
}

function assertObjectPort(value: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof value?.createOnly !== 'function'
    || typeof value?.readExact !== 'function') {
    throw new TypeError('Track All task-QA candidate object port is invalid.')
  }
}

function assertRuntimePorts(input: {
  candidateRepository: CanonicalTrackAllSam31TaskQaCandidateRepository
  lifecycleReadPort: Pick<CanonicalProfessionalGpuDurableLifecycleStore,
    'rereadExecutionEnvelope' | 'rereadLaunchRecord' | 'rereadTerminalRecord'>
  sam31ResultStore: Pick<CanonicalSam31GpuRuntimeResultStore,
    'rereadResultAdmission'>
  sam31TaskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  taskContextRepository: Pick<CanonicalSam31GpuTaskContextRepository,
    'rereadTaskContext'>
  taskQaRepository: Pick<CanonicalTrackAllSam31TaskQaRepository,
    'persistMeasurementCreateOnly' | 'rereadMeasurement' |
    'persistReviewCreateOnly' | 'rereadReview'>
}): void {
  const methods = [
    input.candidateRepository?.rereadWorkerResult,
    input.candidateRepository?.rereadReviewResult,
    input.lifecycleReadPort?.rereadExecutionEnvelope,
    input.lifecycleReadPort?.rereadLaunchRecord,
    input.lifecycleReadPort?.rereadTerminalRecord,
    input.sam31ResultStore?.rereadResultAdmission,
    input.sam31TaskStore?.rereadTask,
    input.taskContextRepository?.rereadTaskContext,
    input.taskQaRepository?.persistMeasurementCreateOnly,
    input.taskQaRepository?.rereadMeasurement,
    input.taskQaRepository?.persistReviewCreateOnly,
    input.taskQaRepository?.rereadReview,
  ]
  if (methods.some((method) => typeof method !== 'function')) {
    throw new TypeError('Track All task-QA finalization ports are invalid.')
  }
}
