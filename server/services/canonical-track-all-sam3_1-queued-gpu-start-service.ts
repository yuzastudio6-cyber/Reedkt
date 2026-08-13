import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_RESULT_VERSION,
  type TrackAllSam31AuthenticatedGpuQueuedStartRequest,
  type TrackAllSam31AuthenticatedGpuQueuedStartResult,
} from '../../src/types/track-all-sam3_1-gpu-queued-start'
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
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  buildTrackAllSam31AuthenticatedGpuStartRequest,
  type CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort,
} from './canonical-track-all-sam3_1-authenticated-gpu-start-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_QUEUED_GPU_START_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-queued-gpu-start-runtime-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID =
  'weeditpro-professional-gpu-production-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION =
  'us-central1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_REQUEST_VERSION,
  ),
  requestId: safeId,
  approvedSnapshotId: safeId,
  workItemKey: safeId,
  userTriggeredAfterApprovedPlan: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  callerSelectedQueuePriorityCapacityRouteOrPriceAccepted: z.literal(false),
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

export interface CanonicalTrackAllSam31QueuedGpuStartRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_QUEUED_GPU_START_RUNTIME_VERSION
  readonly queueId:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID
  readonly runtimeRegion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION
  readonly durablePostgresQueueRequired: true
  readonly directGpuInvocationAllowed: false
  readonly cloudTaskDispatchOwnedByScheduler: true
  readonly routeOwnsGpuPlacementOrPricing: false
  readonly productionAuthority: false
  enqueueApprovedTrackAllWork(input: RuntimeInput): Promise<
    TrackAllSam31AuthenticatedGpuQueuedStartResult
  >
}

export function buildTrackAllSam31AuthenticatedGpuQueuedStartRequest(input: {
  readonly requestId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
}): TrackAllSam31AuthenticatedGpuQueuedStartRequest {
  assertPlainSerializedData(input, 'track_all_sam31_gpu_queued_start_input')
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_REQUEST_VERSION,
    requestId: input.requestId,
    approvedSnapshotId: input.approvedSnapshotId,
    workItemKey: input.workItemKey,
    userTriggeredAfterApprovedPlan: true,
    browserOrCallerExecutionMaterialAccepted: false,
    callerSelectedQueuePriorityCapacityRouteOrPriceAccepted: false,
  })
  return Object.freeze(requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31AuthenticatedGpuQueuedStartRequest(
  value: unknown,
): TrackAllSam31AuthenticatedGpuQueuedStartRequest {
  assertPlainSerializedData(value, 'track_all_sam31_gpu_queued_start_request')
  const request = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All SAM 3.1 queued-start digest is invalid.')
  }
  return structuredClone(request)
}

/**
 * Converts the historical fixed-task preparation bridge into a durable queue
 * admission. The bridge is accepted only when its attempted cloud launch is
 * canonically known not to have executed. This method never calls the current
 * A100 endpoint and never creates a Cloud Task.
 */
export function createCanonicalTrackAllSam31QueuedGpuStartRuntime(input: {
  readonly fundedPreparationRuntime:
    CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort
  readonly fundedLifecycleReadPort: Pick<
    CanonicalProfessionalGpuFundedJobLifecycleStore,
    'rereadPrelaunchAuthorization' | 'rereadLaunchBinding'
  >
  readonly attemptStartReadPort:
    CanonicalProfessionalGpuAttemptStartAuthorityReadPort
  readonly queueTransactionAdapter:
    CanonicalProfessionalGpuFairQueueTransactionAdapter
  readonly now?: () => string
}): CanonicalTrackAllSam31QueuedGpuStartRuntimePort {
  if (input.queueTransactionAdapter.databaseBackend !== 'postgres'
    || !input.queueTransactionAdapter.sharedDurableTransactionPerformed
    || !input.queueTransactionAdapter.multiReplicaDurabilityVerified
    || input.queueTransactionAdapter.browserOrFrontendClientAllowed
    || input.queueTransactionAdapter.automaticTransportRetryAllowed) {
    throw new TypeError(
      'SAM 3.1 queued start requires the multi-replica durable Postgres owner.',
    )
  }
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_QUEUED_GPU_START_RUNTIME_VERSION,
    queueId: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
    runtimeRegion: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
    durablePostgresQueueRequired: true as const,
    directGpuInvocationAllowed: false as const,
    cloudTaskDispatchOwnedByScheduler: true as const,
    routeOwnsGpuPlacementOrPricing: false as const,
    productionAuthority: false as const,
    async enqueueApprovedTrackAllWork(untrusted: RuntimeInput) {
      assertPlainSerializedData(untrusted,
        'track_all_sam31_queued_start_runtime_input')
      const trusted = runtimeInputSchema.parse(untrusted)
      const request = parseTrackAllSam31AuthenticatedGpuQueuedStartRequest(
        trusted.request,
      )
      if (request.requestId !== trusted.idempotencyKey) {
        throw new TypeError(
          'Track All SAM 3.1 queued start differs from its idempotency key.',
        )
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
        || attempt.routeId !== 'a100_80gb_heavy_primary'
        || attempt.attemptOrdinal !== 1) {
        throw new TypeError(
          'Track All SAM 3.1 queued start is not the authenticated A100 attempt.',
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
        await input.fundedPreparationRuntime.startApprovedTrackAllWork({
          authenticatedOwnerUserId: trusted.authenticatedOwnerUserId,
          workspaceId: trusted.workspaceId,
          idempotencyKey: trusted.idempotencyKey,
          request: buildTrackAllSam31AuthenticatedGpuStartRequest({
            requestId: request.requestId,
            approvedSnapshotId: request.approvedSnapshotId,
            workItemKey: request.workItemKey,
          }),
        })
      }
      const prepared = await rereadPreparedPair({
        fundedLifecycleReadPort: input.fundedLifecycleReadPort,
        prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        launchBindingId: identity.launchBindingId,
      })
      if (prepared === null) {
        throw new TypeError(
          'Track All SAM 3.1 fixed-task preparation was not durably reread.',
        )
      }
      const { prelaunch, launchBinding } = prepared
      const funded = prelaunch.fundedDispatchAdmission
      const toolAdmission = funded.toolDispatchAdmission
      if (prelaunch.attemptStartAuthorityRef.id !== attempt.attemptAuthorityId
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
        || launchBinding.routeId !== 'a100_80gb_heavy_primary'
        || launchBinding.accelerator !== 'nvidia_a100_80gb'
        || toolAdmission.toolId !== 'sam3_1'
        || toolAdmission.scope.ownerUserId !==
          trusted.authenticatedOwnerUserId
        || toolAdmission.scope.workspaceId !== trusted.workspaceId
        || toolAdmission.scope.executionAttemptRef.id !==
          attempt.executionAttemptRef.id
        || toolAdmission.scope.userTriggerRecordRef.id !==
          attempt.userTriggerRecordRef.id) {
        throw new TypeError(
          'Track All SAM 3.1 queued start lost funded fixed-task lineage.',
        )
      }
      const queueEntryId = `gpuq-${sha256AuthorityValue({
        domain: 'track_all_sam3_1_production_gpu_queue_entry_v1',
        executionAttemptRef: attempt.executionAttemptRef,
      })}`
      const queueEntry = {
        queueEntryId,
        ownerUserId: funded.scope.ownerUserId,
        workspaceId: funded.scope.workspaceId,
        projectId: funded.scope.projectId,
        routeId: 'a100_80gb_heavy_primary' as const,
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
      const queueRequest = sealCanonicalProfessionalGpuFairQueueTransactionRequest({
        schemaVersion:
          'canonical-professional-gpu-fair-queue-transaction-port-v1',
        operation: 'enqueue',
        requestId: `gpuq-enqueue-${sha256AuthorityValue({
          queueEntryId,
          executionAttemptRef: attempt.executionAttemptRef,
        })}`,
        queueId: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
        runtimeRegion:
          CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
        entry: queueEntry,
        requestedAt: attempt.triggeredAt,
      })
      const queueResult = assertCanonicalProfessionalGpuFairQueueTransactionResult(
        await input.queueTransactionAdapter.enqueue(queueRequest),
      )
      if (queueResult.operation !== 'enqueue'
        || queueResult.requestId !== queueRequest.requestId
        || queueResult.requestDigestSha256 !==
          queueRequest.requestDigestSha256
        || queueResult.queueId !==
          CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID
        || queueResult.runtimeRegion !==
          CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION
        || queueResult.queueEntryRef === null
        || queueResult.queueEntryRef.id !== queueEntryId
        || !isQueueDisposition(queueResult.disposition)) {
        throw new TypeError(
          'Track All SAM 3.1 queue transaction changed its exact lineage.',
        )
      }
      return buildResult({
        request,
        prelaunch,
        launchBinding,
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
    throw new TypeError(
      'Track All SAM 3.1 fixed-task preparation is partially persisted.',
    )
  }
  return Object.freeze({
    prelaunch: assertCanonicalProfessionalGpuFundedPrelaunch(rawPrelaunch),
    launchBinding:
      assertCanonicalProfessionalGpuFundedLaunchBinding(rawLaunchBinding),
  })
}

function buildResult(input: {
  readonly request: TrackAllSam31AuthenticatedGpuQueuedStartRequest
  readonly prelaunch: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedPrelaunch
  >
  readonly launchBinding: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedLaunchBinding
  >
  readonly queueResult: ReturnType<
    typeof assertCanonicalProfessionalGpuFairQueueTransactionResult
  >
}): TrackAllSam31AuthenticatedGpuQueuedStartResult {
  if (!input.queueResult.queueEntryRef
    || !isQueueDisposition(input.queueResult.disposition)) {
    throw new TypeError('SAM 3.1 queue result is not an enqueue result.')
  }
  const funded = input.prelaunch.fundedDispatchAdmission
  const attemptScope = funded.toolDispatchAdmission.scope
  const payload = {
    schemaVersion:
      TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_RESULT_VERSION,
    requestRef: ref(input.request.requestId,
      input.request.requestDigestSha256),
    workspaceId: funded.scope.workspaceId,
    projectId: funded.scope.projectId,
    approvedSnapshotId: input.request.approvedSnapshotId,
    workItemKey: input.request.workItemKey,
    fundedDispatchAdmissionRef: input.prelaunch.fundedDispatchAdmissionRef,
    prelaunchAuthorizationRef: ref(
      input.prelaunch.prelaunchAuthorizationId,
      input.prelaunch.prelaunchAuthorizationHash,
    ),
    fixedTaskPreparationBridgeRef: input.launchBinding.launchRef,
    executionAttemptRef: attemptScope.executionAttemptRef,
    userTriggerRecordRef: attemptScope.userTriggerRecordRef,
    queueEntryRef: input.queueResult.queueEntryRef,
    queueTransactionRef: ref(
      input.queueResult.requestId,
      input.queueResult.resultDigestSha256,
    ),
    queueDisposition: input.queueResult.disposition,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    queueId: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_ID,
    runtimeRegion:
      CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_GPU_QUEUE_REGION,
    minimumIdleGpuInstances: 0 as const,
    userTriggeredScaleFromZero: true as const,
    a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true as const,
    durablePostgresQueueAdmissionCommitted: true as const,
    schedulerOwnsCloudTaskDispatch: true as const,
    taskConsumerMustRereadFundingTaskAndRuntimeAuthorities: true as const,
    directGpuInvocationStartedByRequest: false as const,
    cloudTaskCreationStartedByRequest: false as const,
    callerSuppliedMediaPromptQueuePriorityCapacityRouteModelImageCommandOrPriceAccepted:
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
): value is TrackAllSam31AuthenticatedGpuQueuedStartResult[
  'queueDisposition'
] {
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
