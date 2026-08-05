export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_REQUEST_VERSION =
  'track-all-sam3_1-authenticated-gpu-start-request-v1' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RESULT_VERSION =
  'track-all-sam3_1-authenticated-gpu-start-result-v1' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE_ID =
  'trackAll.sam31.approvedGpuJob.start' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE =
  '/internal/v1/workspaces/:workspaceId/track-all/sam3_1/gpu-jobs/start' as const

export interface TrackAllSam31EvidenceRef {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}

/**
 * Narrow internal trigger for one already-approved Track All work item. It
 * deliberately cannot carry media, prompts, a model, GPU route, image,
 * command, price, credit amount, release, lease, or execution attempt.
 */
export interface TrackAllSam31AuthenticatedGpuStartRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly userTriggeredAfterApprovedPlan: true
  readonly browserOrCallerExecutionMaterialAccepted: false
  readonly callerSelectedGpuRouteModelImageCommandOrPriceAccepted: false
}

export interface TrackAllSam31AuthenticatedGpuStartResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RESULT_VERSION
  readonly requestRef: TrackAllSam31EvidenceRef
  readonly workspaceId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly fundedDispatchAdmissionRef: TrackAllSam31EvidenceRef
  readonly prelaunchAuthorizationRef: TrackAllSam31EvidenceRef
  readonly launchRef: TrackAllSam31EvidenceRef
  readonly launchBindingRef: TrackAllSam31EvidenceRef
  readonly launchDisposition:
    | 'job_created'
    | 'job_rejected_before_creation'
    | 'job_creation_outcome_unknown'
  readonly routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
  readonly accelerator: 'nvidia_a100_80gb' | 'nvidia_l4'
  readonly userTriggeredScaleFromZero: true
  readonly a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true
  readonly approvedSourceMaterialRereadByCanonicalServer: true
  readonly fundedPricingAndReservationRereadBeforeLaunch: true
  readonly rawCloudLaunchPortExposed: false
  readonly callerSuppliedMediaPromptModelRouteImageCommandOrPriceAccepted:
    false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly publicDeliveryAuthorized: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
