export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_REQUEST_VERSION =
  'track-all-sam3_1-l4-task-qa-gpu-start-request-v1' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_RESULT_VERSION =
  'track-all-sam3_1-l4-task-qa-gpu-start-result-v1' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_ROUTE_ID =
  'trackAll.sam31.l4TaskQa.approvedGpuJob.start' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_ROUTE =
  '/internal/v1/workspaces/:workspaceId/track-all/sam3_1/l4-task-qa/gpu-jobs/start' as const

export interface TrackAllSam31L4TaskQaEvidenceRef {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}

export interface TrackAllSam31L4TaskQaCaptionContractRef {
  readonly id: string
  readonly version: string
  readonly contentHash: string
}

/**
 * Identifier-only authenticated trigger. The SAM invocation is reread and
 * scope-matched by the canonical backend; no output bytes, mask paths,
 * commands, images, GPU route, price, or credit value can be supplied.
 */
export interface TrackAllSam31L4TaskQaGpuStartRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_REQUEST_VERSION
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
  readonly callerSelectedGpuRouteImageCommandEnvironmentOrPriceAccepted: false
}

export interface TrackAllSam31L4TaskQaGpuStartResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_RESULT_VERSION
  readonly requestRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly workspaceId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly sam31InvocationId: string
  readonly l4InvocationId: string
  readonly sam31RuntimeResultAdmissionRef:
    TrackAllSam31L4TaskQaEvidenceRef
  readonly l4TaskMaterialRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly fundedDispatchAdmissionRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly prelaunchAuthorizationRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly launchRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly launchBindingRef: TrackAllSam31L4TaskQaEvidenceRef
  readonly launchDisposition:
    | 'job_created'
    | 'job_rejected_before_creation'
    | 'job_creation_outcome_unknown'
  readonly routeId: 'l4_standard_primary'
  readonly accelerator: 'nvidia_l4'
  readonly userTriggeredScaleFromZero: true
  readonly exactSamTaskResultManifestAndApprovedL4WorkReread: true
  readonly accountEffectivePricingAndFundingRereadBeforeLaunch: true
  readonly fixedTaskPersistedAndRereadBeforeCloudJobCreation: true
  readonly separateSam31InputAndL4JobInvocationRoots: true
  readonly rawCloudLaunchPortExposed: false
  readonly callerSuppliedMaskBytesPathsCommandsImageRouteEnvironmentOrPriceAccepted:
    false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly publicDeliveryAuthorized: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
