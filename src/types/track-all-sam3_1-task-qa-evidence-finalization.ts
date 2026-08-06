import type {
  TrackAllSam31CaptionEvidenceRef,
} from './track-all-sam3_1-caption-evidence-finalization'

export const TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_REQUEST_VERSION =
  'track-all-sam3_1-task-qa-evidence-finalization-request-v1' as const
export const TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RESULT_VERSION =
  'track-all-sam3_1-task-qa-evidence-finalization-result-v1' as const
export const TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_ROUTE_ID =
  'trackAll.sam31.taskQaEvidence.finalize' as const
export const TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_ROUTE =
  '/internal/v1/workspaces/:workspaceId/track-all/sam3_1/task-qa-evidence/finalize' as const

/**
 * Ref-only internal request. The caller cannot submit temporal scores, masks,
 * reviewer findings, cloud-job claims, prices, usage, or execution booleans.
 * The canonical backend rereads all of those from create-only private stores.
 */
export interface TrackAllSam31TaskQaEvidenceFinalizationRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly invocationId: string
  readonly sam31RuntimeResultAdmissionRef: TrackAllSam31CaptionEvidenceRef
  readonly l4MaskQaWorkerResultRef: TrackAllSam31CaptionEvidenceRef
  readonly independentPrivateReviewResultRef:
    TrackAllSam31CaptionEvidenceRef
  readonly byteFreeRequest: true
  readonly browserOrCallerMeasurementAccepted: false
  readonly browserOrCallerReviewAccepted: false
  readonly callerCloudJobUsagePriceOrCostAccepted: false
  readonly runtimeDispatchOrAssetMutationRequested: false
}

export interface TrackAllSam31TaskQaEvidenceFinalizationResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_RESULT_VERSION
  readonly requestRef: TrackAllSam31CaptionEvidenceRef
  readonly workspaceId: string
  readonly invocationId: string
  readonly l4MaskQaWorkerResultRef: TrackAllSam31CaptionEvidenceRef
  readonly independentPrivateReviewResultRef:
    TrackAllSam31CaptionEvidenceRef
  readonly l4MaskQaMeasurementRef: TrackAllSam31CaptionEvidenceRef
  readonly privateSceneReviewRef: TrackAllSam31CaptionEvidenceRef
  readonly disposition: 'ready_for_caption_evidence_finalization'
  readonly authenticatedPrincipalVerified: true
  readonly exactSamResultWorkerOutputLaunchEnvelopeTerminalAndReviewReread:
    true
  readonly l4TerminalUsageAccountPriceAndCostReread: true
  readonly workerStoppedAndScaleBackToZeroVerified: true
  readonly createOnlyMeasurementAndReviewPersistedAndReread: true
  readonly browserLocalStateUsed: false
  readonly runtimeExecutionPerformedByFinalizer: false
  readonly assetMutationPerformed: false
  readonly customerCreditsMutated: false
  readonly finalQaApprovalGranted: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
