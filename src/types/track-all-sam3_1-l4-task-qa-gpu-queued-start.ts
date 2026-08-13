import type {
  TrackAllSam31L4TaskQaCaptionContractRef,
  TrackAllSam31L4TaskQaEvidenceRef,
} from './track-all-sam3_1-l4-task-qa-gpu-start'

export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_REQUEST_VERSION =
  'track-all-sam3_1-l4-task-qa-gpu-queued-start-request-v1' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_RESULT_VERSION =
  'track-all-sam3_1-l4-task-qa-gpu-queued-start-result-v1' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_ROUTE_ID =
  'trackAll.sam31.l4TaskQa.approvedGpuQueue.enqueue' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_ROUTE =
  '/internal/v1/workspaces/:workspaceId/track-all/sam3_1/l4-task-qa/gpu-queue/start' as const

/**
 * Identifier-only admission for one independently approved L4 verification
 * attempt. The server rereads the SAM result and Caption support lineage; the
 * caller cannot choose material, route, capacity, priority, image, or price.
 */
export interface TrackAllSam31L4TaskQaGpuQueuedStartRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly sam31InvocationId: string
  readonly priorCaptionCallRef: TrackAllSam31L4TaskQaCaptionContractRef
  readonly selectedCaptionSupportRequestRef:
    TrackAllSam31L4TaskQaCaptionContractRef
  readonly userTriggeredAfterApprovedSam31Result: true
  readonly browserOrCallerExecutionMaterialAccepted: false
  readonly callerSelectedQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
    false
}

/** Queue admission is not runtime completion or QA approval. */
export interface TrackAllSam31L4TaskQaGpuQueuedStartResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_RESULT_VERSION
  readonly requestRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly workspaceId: string
  readonly projectId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly sam31InvocationId: string
  readonly l4InvocationId: string
  readonly l4TaskMaterialRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly fundedDispatchAdmissionRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly prelaunchAuthorizationRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly fixedTaskPreparationBridgeRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly executionAttemptRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly userTriggerRecordRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly queueEntryRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly queueTransactionRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly queueDisposition:
    | 'queued'
    | 'queued_replay'
    | 'active_replay'
    | 'terminal_replay'
  readonly routeId: 'l4_standard_primary'
  readonly accelerator: 'nvidia_l4'
  readonly queueId: 'weeditpro-professional-gpu-production-v1'
  readonly runtimeRegion: 'us-central1'
  readonly minimumIdleGpuInstances: 0
  readonly userTriggeredScaleFromZero: true
  readonly durablePostgresQueueAdmissionCommitted: true
  readonly schedulerOwnsCloudTaskDispatch: true
  readonly taskConsumerMustRereadFundingMaterialTaskAndRuntimeAuthorities: true
  readonly directGpuInvocationStartedByRequest: false
  readonly cloudTaskCreationStartedByRequest: false
  readonly callerSuppliedMaskBytesPathsQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
    false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly publicDeliveryAuthorized: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
