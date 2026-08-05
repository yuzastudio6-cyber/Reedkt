export const TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION =
  'track-all-sam3_1-caption-evidence-finalization-request-v1' as const
export const TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION =
  'track-all-sam3_1-caption-evidence-finalization-result-v1' as const
export const TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE_ID =
  'trackAll.sam31.captionEvidence.finalize' as const
export const TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE =
  '/internal/v1/workspaces/:workspaceId/track-all/sam3_1/caption-evidence/finalize' as const

export interface TrackAllSam31CaptionEvidenceRef {
  readonly id: string
  readonly version: string
  readonly contentHash: string
}

/**
 * Internal, byte-free request to reconcile evidence that has already been
 * persisted by the SAM 3.1 runtime, independent L4 mask-QA worker, and private
 * visual-review owner. It cannot submit masks, measurements, reviews, media,
 * paths, commands, prices, or execution claims.
 */
export interface TrackAllSam31CaptionEvidenceFinalizationRequest {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly priorCallRef: TrackAllSam31CaptionEvidenceRef
  readonly selectedSupportRequestRef: TrackAllSam31CaptionEvidenceRef
  readonly invocationId: string
  readonly runtimeResultAdmissionRef: TrackAllSam31CaptionEvidenceRef
  readonly l4MaskQaMeasurementRef: TrackAllSam31CaptionEvidenceRef
  readonly privateSceneReviewRef: TrackAllSam31CaptionEvidenceRef
  readonly byteFreeRequest: true
  readonly browserOrCallerEvidenceAccepted: false
  readonly directPeerDispatchRequested: false
  readonly runtimeOrAssetMutationRequested: false
}

/** Bounded receipt for the canonical specialist-resume projection. */
export interface TrackAllSam31CaptionEvidenceFinalizationResult {
  readonly schemaVersion:
    typeof TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION
  readonly requestRef: TrackAllSam31CaptionEvidenceRef
  readonly workspaceId: string
  readonly invocationId: string
  readonly supportRequestRef: TrackAllSam31CaptionEvidenceRef
  readonly sceneQaAuthorityRef: TrackAllSam31CaptionEvidenceRef
  readonly sceneEvidenceRef: TrackAllSam31CaptionEvidenceRef
  readonly authenticatedEvidenceRecordRef: TrackAllSam31CaptionEvidenceRef
  readonly authenticatedOwnerProjectionRef: TrackAllSam31CaptionEvidenceRef
  readonly disposition: 'ready_for_specialist_resume'
  readonly authenticatedPrincipalVerified: true
  readonly exactPersistedRuntimeMeasurementAndReviewReread: true
  readonly createOnlySceneAuthorityAndEvidenceReread: true
  readonly authenticatedProjectionPersistedAndReread: true
  readonly browserLocalStateUsed: false
  readonly directPeerDispatchPerformed: false
  readonly runtimeExecutionPerformedByFinalizer: false
  readonly assetMutationPerformed: false
  readonly customerCreditsMutated: false
  readonly finalQaApprovalGranted: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly resultDigestSha256: string
}
