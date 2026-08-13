import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_RESULT_VERSION,
  type TrackAllSam31L4TaskQaGpuQueuedStartRequest,
  type TrackAllSam31L4TaskQaGpuQueuedStartResult,
} from '../../src/types/track-all-sam3_1-l4-task-qa-gpu-queued-start'
import {
  assertCanonicalProfessionalGpuAttemptStartAuthority,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertCanonicalProfessionalGpuFundedLaunchBinding,
  assertCanonicalProfessionalGpuFundedPrelaunch,
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionResult,
  sealCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
} from './canonical-professional-gpu-fair-queue-transaction-port'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  buildTrackAllSam31L4TaskQaGpuStartRequest,
  type CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort,
} from './canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaMaterialV2,
  type CanonicalTrackAllSam31L4TaskQaMaterialRepository,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'
import { sha256AuthorityValue } from './private-edit-authority-store'
import {
  CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
  CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
} from './canonical-track-all-sam3_1-queued-gpu-start-service'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_QUEUED_START_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-queued-start-runtime-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const captionRefSchema = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_REQUEST_VERSION,
  ),
  requestId: safeId,
  approvedSnapshotId: safeId,
  workItemKey: safeId,
  sam31InvocationId: safeId,
  priorCaptionCallRef: captionRefSchema,
  selectedCaptionSupportRequestRef: captionRefSchema,
  userTriggeredAfterApprovedSam31Result: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  callerSelectedQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
    z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const runtimeInputSchema = z.object({
  authenticatedOwnerUserId: safeId,
  workspaceId: safeId,
  idempotencyKey: safeId,
  request: z.unknown(),
}).strict()

type RuntimeInput = z.infer<typeof runtimeInputSchema>
type AttemptReadInput = Parameters<
  CanonicalProfessionalGpuAttemptStartAuthorityReadPort[
    'rereadCreateOnlyAttemptStart'
  ]
>[0]

export interface CanonicalTrackAllSam31L4TaskQaQueuedStartRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_QUEUED_START_RUNTIME_VERSION
  readonly queueId:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID
  readonly runtimeRegion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION
  readonly durablePostgresQueueRequired: true
  readonly directGpuInvocationAllowed: false
  readonly cloudTaskDispatchOwnedByScheduler: true
  readonly materialPreparedAndRereadBeforeQueueAdmission: true
  readonly routeOwnsGpuPlacementOrPricing: false
  readonly productionAuthority: false
  enqueueApprovedTaskQaWork(input: RuntimeInput): Promise<
    TrackAllSam31L4TaskQaGpuQueuedStartResult
  >
}

export function buildTrackAllSam31L4TaskQaGpuQueuedStartRequest(input: {
  readonly requestId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly sam31InvocationId: string
  readonly priorCaptionCallRef: z.infer<typeof captionRefSchema>
  readonly selectedCaptionSupportRequestRef: z.infer<typeof captionRefSchema>
}): TrackAllSam31L4TaskQaGpuQueuedStartRequest {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_queue_input')
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_REQUEST_VERSION,
    ...structuredClone(input),
    userTriggeredAfterApprovedSam31Result: true,
    browserOrCallerExecutionMaterialAccepted: false,
    callerSelectedQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
      false,
  })
  return Object.freeze(requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31L4TaskQaGpuQueuedStartRequest(
  value: unknown,
): TrackAllSam31L4TaskQaGpuQueuedStartRequest {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_queue_request')
  const request = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 queued-start digest is invalid.')
  }
  return structuredClone(request)
}

/**
 * Converts the known-not-executed fixed-task preparation bridge into a durable
 * queue entry. Neither this adapter nor the caller creates a Cloud Task or GPU
 * job; the authenticated scheduler and route-aware consumer own those steps.
 */
export function createCanonicalTrackAllSam31L4TaskQaQueuedStartRuntime(input: {
  readonly fundedPreparationRuntime:
    CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort
  readonly fundedLifecycleReadPort: Pick<
    CanonicalProfessionalGpuFundedJobLifecycleStore,
    'rereadPrelaunchAuthorization' | 'rereadLaunchBinding'
  >
  readonly materialRepository: Pick<
    CanonicalTrackAllSam31L4TaskQaMaterialRepository,
    'rereadMaterial'
  >
  readonly attemptStartReadPort:
    CanonicalProfessionalGpuAttemptStartAuthorityReadPort
  readonly queueTransactionAdapter:
    CanonicalProfessionalGpuFairQueueTransactionAdapter
  readonly now?: () => string
}): CanonicalTrackAllSam31L4TaskQaQueuedStartRuntimePort {
  if (input.queueTransactionAdapter.databaseBackend !== 'postgres'
    || !input.queueTransactionAdapter.sharedDurableTransactionPerformed
    || !input.queueTransactionAdapter.multiReplicaDurabilityVerified
    || input.queueTransactionAdapter.browserOrFrontendClientAllowed
    || input.queueTransactionAdapter.automaticTransportRetryAllowed) {
    throw new TypeError(
      'Track All L4 queued start requires the durable Postgres owner.',
    )
  }
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_QUEUED_START_RUNTIME_VERSION,
    queueId: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
    runtimeRegion: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
    durablePostgresQueueRequired: true as const,
    directGpuInvocationAllowed: false as const,
    cloudTaskDispatchOwnedByScheduler: true as const,
    materialPreparedAndRereadBeforeQueueAdmission: true as const,
    routeOwnsGpuPlacementOrPricing: false as const,
    productionAuthority: false as const,
    async enqueueApprovedTaskQaWork(untrusted: RuntimeInput) {
      assertPlainSerializedData(untrusted,
        'track_all_l4_task_qa_queued_start_runtime_input')
      const trusted = runtimeInputSchema.parse(untrusted)
      const request = parseTrackAllSam31L4TaskQaGpuQueuedStartRequest(
        trusted.request,
      )
      if (request.requestId !== trusted.idempotencyKey) {
        throw new TypeError('Track All L4 queue idempotency differs.')
      }
      const observedAt = z.string().datetime({ offset: true }).parse(now())
      const attempt = await rereadExactAttempt({
        readPort: input.attemptStartReadPort,
        query: {
          workspaceId: trusted.workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          at: observedAt,
        },
      })
      if (attempt.scope.ownerUserId !== trusted.authenticatedOwnerUserId
        || attempt.scope.workspaceId !== trusted.workspaceId
        || attempt.approvedSnapshotRef.id !== request.approvedSnapshotId
        || attempt.idempotencyKey !== trusted.idempotencyKey
        || attempt.routeId !== 'l4_standard_primary'
        || attempt.attemptOrdinal !== 1) {
        throw new TypeError(
          'Track All L4 queue start is not the authenticated first attempt.',
        )
      }
      const identity = createCanonicalProfessionalGpuFundedLifecycleIdentity({
        attemptStartAuthority: attempt,
      })
      const existing = await rereadPreparedPair({
        fundedLifecycleReadPort: input.fundedLifecycleReadPort,
        prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        launchBindingId: identity.launchBindingId,
      })
      if (existing === null) {
        await input.fundedPreparationRuntime.startApprovedTaskQaWork({
          authenticatedOwnerUserId: trusted.authenticatedOwnerUserId,
          workspaceId: trusted.workspaceId,
          idempotencyKey: trusted.idempotencyKey,
          request: buildTrackAllSam31L4TaskQaGpuStartRequest({
            requestId: request.requestId,
            approvedSnapshotId: request.approvedSnapshotId,
            workItemKey: request.workItemKey,
            sam31InvocationId: request.sam31InvocationId,
            priorCaptionCallRef: request.priorCaptionCallRef,
            selectedCaptionSupportRequestRef:
              request.selectedCaptionSupportRequestRef,
          }),
        })
      }
      const prepared = await rereadPreparedPair({
        fundedLifecycleReadPort: input.fundedLifecycleReadPort,
        prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        launchBindingId: identity.launchBindingId,
      })
      if (prepared === null) throw new TypeError(
        'Track All L4 fixed-task preparation was not durably reread.',
      )
      const material = assertCanonicalTrackAllSam31L4TaskQaMaterialV2(
        await input.materialRepository.rereadMaterial({
          executionAttemptRef: attempt.executionAttemptRef,
        }),
      )
      const { prelaunch, launchBinding } = prepared
      const funded = prelaunch.fundedDispatchAdmission
      const toolAdmission = funded.toolDispatchAdmission
      if (material.sam31InvocationId !== request.sam31InvocationId
        || material.executionAttemptRef.id !== attempt.executionAttemptRef.id
        || prelaunch.attemptStartAuthorityRef.id !== attempt.attemptAuthorityId
        || prelaunch.attemptStartAuthorityRef.contentHash !==
          `sha256:${attempt.attemptAuthorityHash}`
        || launchBinding.prelaunchAuthorizationRef.id !==
          prelaunch.prelaunchAuthorizationId
        || launchBinding.prelaunchAuthorizationRef.contentHash !==
          `sha256:${prelaunch.prelaunchAuthorizationHash}`
        || launchBinding.launchDisposition !==
          'job_rejected_before_creation'
        || launchBinding.providerInferenceOrSubstantiveWorkKnownExecuted !==
          'not_executed'
        || launchBinding.routeId !== 'l4_standard_primary'
        || launchBinding.accelerator !== 'nvidia_l4'
        || toolAdmission.toolId !== 'kornia'
        || toolAdmission.operationId !== 'tool.kornia.refine_mask.v1'
        || toolAdmission.scope.ownerUserId !==
          trusted.authenticatedOwnerUserId
        || toolAdmission.scope.workspaceId !== trusted.workspaceId
        || toolAdmission.scope.executionAttemptRef.id !==
          attempt.executionAttemptRef.id
        || toolAdmission.scope.userTriggerRecordRef.id !==
          attempt.userTriggerRecordRef.id) {
        throw new TypeError(
          'Track All L4 queue start lost material or funded lineage.',
        )
      }
      const queueEntryId = `gpuq-${sha256AuthorityValue({
        domain: 'track_all_sam3_1_l4_task_qa_gpu_queue_entry_v1',
        executionAttemptRef: attempt.executionAttemptRef,
        materialHash: material.materialHash,
      })}`
      const queueEntry = {
        queueEntryId,
        ownerUserId: funded.scope.ownerUserId,
        workspaceId: funded.scope.workspaceId,
        projectId: funded.scope.projectId,
        routeId: 'l4_standard_primary' as const,
        approvedSnapshotRef: funded.approvedSnapshotRef,
        approvedWorkItemRef: funded.approvedWorkItemRef,
        fundedDispatchAdmissionRef: prelaunch.fundedDispatchAdmissionRef,
        executionAttemptRef: attempt.executionAttemptRef,
        userTriggerRecordRef: attempt.userTriggerRecordRef,
        enqueuedAt: attempt.triggeredAt,
        enqueueOrdinal: attempt.attemptOrdinal,
        userTriggeredAfterApprovalAndFunding: true as const,
        callerSelectedPriorityCapacityOrRoute: false as const,
      }
      const queueRequest =
        sealCanonicalProfessionalGpuFairQueueTransactionRequest({
          schemaVersion:
            'canonical-professional-gpu-fair-queue-transaction-port-v1',
          operation: 'enqueue',
          requestId: `gpuq-enqueue-${sha256AuthorityValue({
            queueEntryId,
            executionAttemptRef: attempt.executionAttemptRef,
            materialHash: material.materialHash,
          })}`,
          queueId: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
          runtimeRegion:
            CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
          entry: queueEntry,
          requestedAt: attempt.triggeredAt,
        })
      const queueResult =
        assertCanonicalProfessionalGpuFairQueueTransactionResult(
          await input.queueTransactionAdapter.enqueue(queueRequest),
        )
      if (queueResult.operation !== 'enqueue'
        || queueResult.requestId !== queueRequest.requestId
        || queueResult.requestDigestSha256 !==
          queueRequest.requestDigestSha256
        || queueResult.queueEntryRef?.id !== queueEntryId
        || !isQueueDisposition(queueResult.disposition)) {
        throw new TypeError('Track All L4 queue transaction changed lineage.')
      }
      return buildResult({
        request,
        prelaunch,
        launchBinding,
        material,
        queueResult,
      })
    },
  })
}

async function rereadExactAttempt(input: {
  readonly readPort: CanonicalProfessionalGpuAttemptStartAuthorityReadPort
  readonly query: AttemptReadInput
}) {
  return assertCanonicalProfessionalGpuAttemptStartAuthority(
    await input.readPort.rereadCreateOnlyAttemptStart(input.query),
    input.query.at,
  )
}

async function rereadPreparedPair(input: {
  readonly fundedLifecycleReadPort: Pick<
    CanonicalProfessionalGpuFundedJobLifecycleStore,
    'rereadPrelaunchAuthorization' | 'rereadLaunchBinding'
  >
  readonly prelaunchAuthorizationId: string
  readonly launchBindingId: string
}): Promise<{
  readonly prelaunch: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedPrelaunch
  >
  readonly launchBinding: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedLaunchBinding
  >
} | null> {
  const [rawPrelaunch, rawLaunchBinding] = await Promise.all([
    input.fundedLifecycleReadPort.rereadPrelaunchAuthorization({
      prelaunchAuthorizationId: input.prelaunchAuthorizationId,
    }),
    input.fundedLifecycleReadPort.rereadLaunchBinding({
      launchBindingId: input.launchBindingId,
    }),
  ])
  if (rawPrelaunch === null && rawLaunchBinding === null) return null
  if (rawPrelaunch === null || rawLaunchBinding === null) {
    throw new TypeError('Track All L4 preparation is partially persisted.')
  }
  return Object.freeze({
    prelaunch: assertCanonicalProfessionalGpuFundedPrelaunch(rawPrelaunch),
    launchBinding:
      assertCanonicalProfessionalGpuFundedLaunchBinding(rawLaunchBinding),
  })
}

function buildResult(input: {
  readonly request: TrackAllSam31L4TaskQaGpuQueuedStartRequest
  readonly prelaunch: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedPrelaunch
  >
  readonly launchBinding: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedLaunchBinding
  >
  readonly material: ReturnType<
    typeof assertCanonicalTrackAllSam31L4TaskQaMaterialV2
  >
  readonly queueResult: ReturnType<
    typeof assertCanonicalProfessionalGpuFairQueueTransactionResult
  >
}): TrackAllSam31L4TaskQaGpuQueuedStartResult {
  if (!input.queueResult.queueEntryRef
    || !isQueueDisposition(input.queueResult.disposition)) {
    throw new TypeError('Track All L4 queue result is not an enqueue result.')
  }
  const funded = input.prelaunch.fundedDispatchAdmission
  const scope = funded.toolDispatchAdmission.scope
  const l4InvocationId = `${funded.toolDispatchAdmission.admissionId}`
    + '.execution-envelope'
  const payload = {
    schemaVersion:
      TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_RESULT_VERSION,
    requestRef: ref(input.request.requestId,
      input.request.requestDigestSha256),
    workspaceId: funded.scope.workspaceId,
    projectId: funded.scope.projectId,
    approvedSnapshotId: input.request.approvedSnapshotId,
    workItemKey: input.request.workItemKey,
    sam31InvocationId: input.material.sam31InvocationId,
    l4InvocationId,
    l4TaskMaterialRef: ref(input.material.materialId,
      input.material.materialHash),
    fundedDispatchAdmissionRef: input.prelaunch.fundedDispatchAdmissionRef,
    prelaunchAuthorizationRef: ref(
      input.prelaunch.prelaunchAuthorizationId,
      input.prelaunch.prelaunchAuthorizationHash,
    ),
    fixedTaskPreparationBridgeRef: input.launchBinding.launchRef,
    executionAttemptRef: scope.executionAttemptRef,
    userTriggerRecordRef: scope.userTriggerRecordRef,
    queueEntryRef: input.queueResult.queueEntryRef,
    queueTransactionRef: ref(
      input.queueResult.requestId,
      input.queueResult.resultDigestSha256,
    ),
    queueDisposition: input.queueResult.disposition,
    routeId: 'l4_standard_primary' as const,
    accelerator: 'nvidia_l4' as const,
    queueId: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
    runtimeRegion:
      CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
    minimumIdleGpuInstances: 0 as const,
    userTriggeredScaleFromZero: true as const,
    durablePostgresQueueAdmissionCommitted: true as const,
    schedulerOwnsCloudTaskDispatch: true as const,
    taskConsumerMustRereadFundingMaterialTaskAndRuntimeAuthorities:
      true as const,
    directGpuInvocationStartedByRequest: false as const,
    cloudTaskCreationStartedByRequest: false as const,
    callerSuppliedMaskBytesPathsQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return Object.freeze({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function isQueueDisposition(
  value: string,
): value is TrackAllSam31L4TaskQaGpuQueuedStartResult['queueDisposition'] {
  return value === 'queued'
    || value === 'queued_replay'
    || value === 'active_replay'
    || value === 'terminal_replay'
}

function ref(id: string, hash: string) {
  return Object.freeze({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}
