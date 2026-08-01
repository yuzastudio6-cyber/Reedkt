export const LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_VERSION =
  'living-frame-non-character-content-lineage-v1' as const

export const LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_CLASS =
  'byte_free_structural_binding_to_existing_content_and_execution_owners' as const

export const LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS = [
  'source_bound_map_route',
  'source_bound_archive_document',
  'source_bound_exact_diagram',
  'source_bound_hybrid_expansion',
] as const

export type LivingFrameNonCharacterContentCaseId =
  typeof LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS[number]

export type LivingFrameNonCharacterContentPlanOwner =
  | 'MapAnimationPlan'
  | 'DataVizPlan'

export type LivingFrameNonCharacterContentMode =
  | 'living_a_roll'
  | 'living_archive'
  | 'living_diagram'
  | 'hybrid_expansion'

export const LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_OPEN_GATES = [
  'canonical_approved_snapshot_reread_required',
  'canonical_selected_scene_admission_reread_required',
  'canonical_map_dataviz_and_fact_safety_reread_required',
  'canonical_source_citation_and_claim_evidence_required',
  'canonical_master_timing_motion_interval_reread_required',
  'canonical_estimate_and_cost_binding_required',
  'canonical_work_output_and_asset_manifest_reconciliation_required',
  'canonical_renderer_layer_binding_required',
  'canonical_deterministic_and_postrender_visual_qa_required',
  'canonical_private_review_required',
] as const

export type LivingFrameNonCharacterContentLineageOpenGate =
  typeof LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_OPEN_GATES[number]

export interface LivingFrameNonCharacterDigestRef {
  readonly refId: string
  readonly refVersion: string
  readonly digestSha256: string
}

export type LivingFrameNonCharacterSourceEvidenceKind =
  | 'map_coordinate_citation'
  | 'map_route_geometry'
  | 'archive_document_artifact'
  | 'archive_ocr_excerpt_citation'
  | 'dataviz_approved_rows'
  | 'hybrid_source_content'

export interface LivingFrameNonCharacterSourceEvidenceRef
  extends LivingFrameNonCharacterDigestRef {
  readonly evidenceKind:
    LivingFrameNonCharacterSourceEvidenceKind
  readonly canonicalRereadRequired: true
  readonly immutableSourceAuthorityClaimed: false
}

export interface LivingFrameNonCharacterSelectedSceneRef
  extends LivingFrameNonCharacterDigestRef {
  readonly sceneId: string
  readonly mode: LivingFrameNonCharacterContentMode
  readonly professionalSkillComponentVersion:
    'living-frame-professional-skill-component-v1'
  readonly canonicalSelectedSceneBindingVersion:
    'canonical-living-frame-selected-scene-binding-v1'
  readonly canonicalRereadRequired: true
}

export interface LivingFrameNonCharacterApprovedPlanRefs {
  readonly approvedSnapshot:
    LivingFrameNonCharacterDigestRef
  readonly confirmedOutputFrame:
    LivingFrameNonCharacterDigestRef
  readonly masterTiming:
    LivingFrameNonCharacterDigestRef
  readonly approvedLineageBinding:
    LivingFrameNonCharacterDigestRef
  readonly motionInterval:
    LivingFrameNonCharacterDigestRef
  readonly estimateCostProjection:
    LivingFrameNonCharacterDigestRef
  readonly workGraphProjection:
    LivingFrameNonCharacterDigestRef
  readonly approvedWorkItem:
    LivingFrameNonCharacterDigestRef
  readonly approvedOutputIntent:
    LivingFrameNonCharacterDigestRef
  readonly assetManifest:
    LivingFrameNonCharacterDigestRef
  readonly assetManifestEntry:
    LivingFrameNonCharacterDigestRef
  readonly rendererBinding:
    LivingFrameNonCharacterDigestRef
  readonly rendererLayer:
    LivingFrameNonCharacterDigestRef
  readonly sceneEvidencePackage:
    LivingFrameNonCharacterDigestRef
  readonly postrenderVisualInspectionRequest:
    LivingFrameNonCharacterDigestRef
  readonly deterministicQa:
    LivingFrameNonCharacterDigestRef
  readonly privateReviewAssembly:
    LivingFrameNonCharacterDigestRef
}

export interface LivingFrameNonCharacterPlanningOwnerRef {
  readonly ownerType:
    LivingFrameNonCharacterContentPlanOwner
  readonly ownerPlanId: string
  readonly ownerPlanDigestSha256: string
  readonly ownerItemId: string
  readonly ownerItemDigestSha256: string
  readonly canonicalApprovedSnapshotRereadRequired: true
  readonly immutableSourceAuthorityClaimed: false
}

export interface LivingFrameNonCharacterSourceTruthSummary {
  readonly sourceRecordCount: number
  readonly sourceCitationCount: number
  readonly sourceNeededCount: 0
  readonly unknownOrUnsafeCount: 0
  readonly claimOrConfidenceStatuses:
    readonly string[]
  readonly sourceRecordSetDigestSha256: string
  readonly rawLabelsValuesCoordinatesExcerptsAndClaimsOmitted: true
  readonly exactMapOrDataMustRemainDeterministic: true
  readonly generatedVideoMayNotOwnExactContent: true
}

export interface LivingFrameNonCharacterFactSafetyRef {
  readonly ownerType: 'DocumentaryFactSafetyPlan'
  readonly ownerPlanId: string
  readonly ownerPlanDigestSha256: string
  readonly linkedFactSafetyItemIds:
    readonly string[]
  readonly linkedFactSafetyItemSetDigestSha256: string
  readonly sourceNeededCount: 0
  readonly unknownClaimCount: 0
  readonly canonicalApprovedSnapshotRereadRequired: true
}

export interface LivingFrameNonCharacterApprovedWorkSourceRef {
  readonly ownerType: 'ApprovedToolWorkSourceReferences'
  readonly sourceReferencesDigestSha256: string
  readonly toolStrategyItemCount: number
  readonly professionalSkillCount: number
  readonly renderStrategyItemCount: number
  readonly workItemCount: number
  readonly canonicalWorkAndManifestRereadRequired: true
}

export interface LivingFrameNonCharacterToolRouteRef {
  readonly toolIds: readonly string[]
  readonly operationIds: readonly string[]
  readonly routeDigestSha256: string
  readonly allIdentitiesAlreadyExist: true
  readonly createsNoToolIdentity: true
  readonly exactContentOwnedByControlledPlanningData: true
  readonly remotionOwnsFinalCanvas: true
  readonly aiVideoOwnsNoExactMapDataDocumentOrLabels: true
  readonly operationRegistrationOrDispatchClaimed: false
}

export interface LivingFrameNonCharacterContentLineageCase {
  readonly caseId:
    LivingFrameNonCharacterContentCaseId
  readonly order: number
  readonly selectedScene:
    LivingFrameNonCharacterSelectedSceneRef
  readonly approvedPlanRefs:
    LivingFrameNonCharacterApprovedPlanRefs
  readonly sourceEvidenceRefs:
    readonly LivingFrameNonCharacterSourceEvidenceRef[]
  readonly sourceEvidenceSetDigestSha256: string
  readonly planningOwner:
    LivingFrameNonCharacterPlanningOwnerRef
  readonly sourceTruth:
    LivingFrameNonCharacterSourceTruthSummary
  readonly factSafety:
    LivingFrameNonCharacterFactSafetyRef
  readonly approvedWorkSource:
    LivingFrameNonCharacterApprovedWorkSourceRef
  readonly toolRoute:
    LivingFrameNonCharacterToolRouteRef
  readonly exactFramesRemainOwnedByMasterTiming: true
  readonly captionsAndOccupancyRemainSeparateOwners: true
  readonly postrenderAiVisualInspectionRequired: true
  readonly canonicalPrivateReviewRequired: true
  readonly caseDigestSha256: string
}

export interface LivingFrameNonCharacterContentLineageAuthorityBoundary {
  readonly structuralBindingOnly: true
  readonly mapAuthority: false
  readonly dataVizAuthority: false
  readonly archiveTextOrOcrAuthority: false
  readonly sourceEvidenceAuthority: false
  readonly documentaryFactAuthority: false
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly hybridTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly captionAuthority: false
  readonly workGraphAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly costAuthority: false
  readonly artifactAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameNonCharacterContentLineageBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_VERSION
  readonly bindingClass:
    typeof LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_CLASS
  readonly bindingState:
    'all_representative_content_refs_bound_canonical_reread_and_admission_pending'
  readonly cases:
    readonly LivingFrameNonCharacterContentLineageCase[]
  readonly caseCount: 4
  readonly openGateCodes:
    readonly LivingFrameNonCharacterContentLineageOpenGate[]
  readonly authorityBoundary:
    LivingFrameNonCharacterContentLineageAuthorityBoundary
  readonly ownerScopeAmendmentPreserved: true
  readonly animatedLivingOrOrganicSubjectAllowed: false
  readonly completeCharacterKeyposeOrInterpolationAllowed: false
  readonly livingSubjectRiggingAllowed: false
  readonly mechanicalRiggingAllowed: false
  readonly staticIllustrationMayRemainUnanimated: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly containsRawMapCoordinatesDataValuesDocumentExcerptsOrClaims:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactCreated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameNonCharacterContentLineageBinding
  extends LivingFrameNonCharacterContentLineageBindingDraft {
  readonly bindingDigestSha256: string
}
