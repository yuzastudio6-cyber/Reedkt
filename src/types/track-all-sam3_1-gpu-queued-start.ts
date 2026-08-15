import type { TrackAllSam31EvidenceRef } from './track-all-sam3_1-gpu-start'

export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_REQUEST_VERSION =
  'track-all-sam3_1-authenticated-gpu-queued-start-request-v3' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_RESULT_VERSION =
  'track-all-sam3_1-authenticated-gpu-queued-start-result-v3' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_ROUTE_ID =
  'trackAll.sam31.approvedGpuQueue.enqueue' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_ROUTE =
  '/internal/v3/workspaces/:workspaceId/track-all/sam3_1/gpu-queue/start' as const

/**
 * Identifier-only trigger for one funded SAM 3.1 attempt. The caller cannot
 * supply queue priority, capacity, placement, media, prompts, model/image
 * coordinates, pricing, credit values, or execution material.
 */
export interface TrackAllSam31AuthenticatedGpuQueuedStartRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly userTriggeredAfterApprovedPlan: true
  readonly browserOrCallerExecutionMaterialAccepted: false
  readonly callerSelectedQueuePriorityCapacityRouteOrPriceAccepted: false
}

/**
 * Durable admission receipt. This does not mean a GPU has started. A separate
 * authenticated scheduler and task consumer must claim the entry, reread the
 * exact funded authorities, and record a durable dispatch outcome first.
 */
export interface TrackAllSam31AuthenticatedGpuQueuedStartResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_RESULT_VERSION
  readonly requestRef: TrackAllSam31EvidenceRef
  readonly workspaceId: string
  readonly projectId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly fundedDispatchAdmissionRef: TrackAllSam31EvidenceRef
  readonly prelaunchAuthorizationRef: TrackAllSam31EvidenceRef
  readonly fixedTaskPreparationBridgeRef: TrackAllSam31EvidenceRef
  readonly executionAttemptRef: TrackAllSam31EvidenceRef
  readonly userTriggerRecordRef: TrackAllSam31EvidenceRef
  readonly queueEntryRef: TrackAllSam31EvidenceRef
  readonly queueTransactionRef: TrackAllSam31EvidenceRef
  readonly queueDisposition:
    | 'queued'
    | 'queued_replay'
    | 'active_replay'
    | 'terminal_replay'
  readonly routeId: 'a100_80gb_heavy_primary'
  readonly accelerator: 'nvidia_a100_80gb'
  readonly queueId: 'weeditpro-professional-gpu-production-v1'
  readonly runtimeRegion: 'us-central1'
  readonly minimumIdleGpuInstances: 0
  readonly userTriggeredScaleFromZero: true
  readonly a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true
  readonly durablePostgresQueueAdmissionCommitted: true
  readonly schedulerOwnsCloudTaskDispatch: true
  readonly taskConsumerMustRereadFundingTaskAndRuntimeAuthorities: true
  readonly directGpuInvocationStartedByRequest: false
  readonly cloudTaskCreationStartedByRequest: false
  readonly callerSuppliedMediaPromptQueuePriorityCapacityRouteModelImageCommandOrPriceAccepted:
    false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly publicDeliveryAuthorized: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
