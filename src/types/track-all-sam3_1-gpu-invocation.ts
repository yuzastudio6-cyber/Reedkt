import type { TrackAllSam31EvidenceRef } from './track-all-sam3_1-gpu-start'

export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_REQUEST_VERSION =
  'track-all-sam3_1-authenticated-gpu-invocation-request-v2' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RESULT_VERSION =
  'track-all-sam3_1-authenticated-gpu-invocation-result-v2' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_ROUTE_ID =
  'trackAll.sam31.approvedGpuInvocation.start' as const
export const TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_ROUTE =
  '/internal/v2/workspaces/:workspaceId/track-all/sam3_1/gpu-invocations/start' as const

/**
 * Identifier-only trigger for one approved A100 endpoint invocation. The
 * browser cannot select media, prompts, a model, endpoint, GPU, image, price,
 * reservation, lease, or attempt.
 */
export interface TrackAllSam31AuthenticatedGpuInvocationRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly userTriggeredAfterApprovedPlan: true
  readonly browserOrCallerExecutionMaterialAccepted: false
  readonly callerSelectedEndpointGpuModelImageCommandOrPriceAccepted: false
}

/**
 * Endpoint-shaped result for the current A100 primary. It intentionally does
 * not reuse the historical Cloud Job result or claim that a prediction
 * endpoint is a job.
 */
export interface TrackAllSam31AuthenticatedGpuInvocationResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RESULT_VERSION
  readonly requestRef: TrackAllSam31EvidenceRef
  readonly workspaceId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly fundedDispatchAdmissionRef: TrackAllSam31EvidenceRef
  readonly prelaunchAuthorizationRef: TrackAllSam31EvidenceRef
  readonly fixedTaskPreparationBridgeRef: TrackAllSam31EvidenceRef
  readonly endpointInvocationAttemptRef: TrackAllSam31EvidenceRef
  readonly endpointCallStartRef: TrackAllSam31EvidenceRef
  readonly endpointInvocationResultRef: TrackAllSam31EvidenceRef
  readonly executionAttemptRef: TrackAllSam31EvidenceRef
  readonly runtimeResponseRef: TrackAllSam31EvidenceRef | null
  readonly invocationDisposition:
    | 'completed'
    | 'failed'
    | 'not_executed_scale_from_zero_trigger'
    | 'outcome_unknown_requires_reconciliation'
  readonly providerOutcome: 'executed' | 'not_executed' | 'unknown'
  readonly runtimeStatus: 'completed' | 'failed' | null
  readonly routeId: 'a100_80gb_heavy_primary'
  readonly accelerator: 'nvidia_a100_80gb'
  readonly userTriggeredScaleFromZero: true
  readonly currentDedicatedEndpointInvocation: true
  readonly historicalCloudJobCustomerDispatchUsed: false
  readonly currentEndpointReadinessRereadBeforeInvocation: true
  readonly approvedSourceMaterialRereadByCanonicalServer: true
  readonly fundedPricingReservationAndAttemptRereadBeforeInvocation: true
  readonly accountEffectiveServingRateRereadBeforeInvocation: true
  readonly automaticRetryAllowed: false
  readonly unresolvedOutcomeBlocksRetry: boolean
  readonly canonicalServingWindowUsageCostAndCreditSettlementPending: true
  readonly callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
    false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly publicDeliveryAuthorized: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
