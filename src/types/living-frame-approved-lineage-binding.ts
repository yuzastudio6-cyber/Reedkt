export const LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION =
  'living-frame-approved-lineage-binding-v1' as const

export const LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS =
  'controlled_non_executable_approved_snapshot_lineage_binding' as const

export const LIVING_FRAME_APPROVED_LINEAGE_READER_VERSION =
  'living-frame-approved-lineage-reader-v1' as const

export const LIVING_FRAME_APPROVED_LINEAGE_LOCATOR_VERSION =
  'living-frame-approved-lineage-locator-v1' as const

export const LIVING_FRAME_APPROVED_LINEAGE_STATES = [
  'blocked_by_canonical_living_frame_component_admission',
  'blocked_by_work_or_asset_lineage',
] as const
export type LivingFrameApprovedLineageState =
  (typeof LIVING_FRAME_APPROVED_LINEAGE_STATES)[number]

export const LIVING_FRAME_APPROVED_LINEAGE_OPEN_GATES = [
  'canonical_selected_living_frame_scene_component_ref_required',
  'canonical_living_frame_renderer_binding_component_ref_required',
  'canonical_living_frame_choreography_binding_component_ref_required',
  'canonical_renderer_layer_extension_required',
  'approved_work_output_lineage_incomplete',
  'approved_asset_manifest_lineage_incomplete',
  'canonical_artifact_qa_required',
  'canonical_private_remotion_review_required',
] as const
export type LivingFrameApprovedLineageOpenGate =
  (typeof LIVING_FRAME_APPROVED_LINEAGE_OPEN_GATES)[number]

export const LIVING_FRAME_APPROVED_LAYER_LINEAGE_STATES = [
  'covered_by_exact_approved_work_output_and_planned_asset',
  'missing_approved_work_output',
  'missing_planned_asset',
] as const
export type LivingFrameApprovedLayerLineageState =
  (typeof LIVING_FRAME_APPROVED_LAYER_LINEAGE_STATES)[number]

export interface LivingFrameApprovedLineageLocator {
  readonly schemaVersion:
    typeof LIVING_FRAME_APPROVED_LINEAGE_LOCATOR_VERSION
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly snapshotId: string
}

export interface LivingFrameApprovedLayerLineage {
  readonly order: number
  readonly sceneId: string
  readonly projectedComponentId: string
  readonly rendererLayerId: string
  readonly approvedWorkItemId: string | null
  readonly approvedWorkItemKey: string | null
  readonly outputKey: string | null
  readonly plannedAssetManifestEntryId: string | null
  readonly required: boolean | null
  readonly previewPlaceholderAllowed: boolean | null
  readonly lineageState: LivingFrameApprovedLayerLineageState
}

export interface LivingFrameApprovedLineageMetrics {
  readonly projectedLayerCount: number
  readonly workOutputCoveredLayerCount: number
  readonly assetManifestCoveredLayerCount: number
  readonly requiredAssetCount: number
  readonly placeholderAllowedAssetCount: number
}

export interface LivingFrameApprovedLineageAuthorityBoundary {
  readonly controlledLineageObservationOnly: true
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly qaApprovalAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameApprovedLineageBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION
  readonly bindingClass:
    typeof LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS
  readonly sceneId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings: {
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedPlanId: string
    readonly approvedPlanVersion: number
    readonly approvedPlanHashSha256: string
    readonly approvedWorkGraphHashSha256: string
    readonly approvedTimingHashSha256: string
    readonly approvedAssetManifestHashSha256: string
    readonly canonicalRendererPlanRefSha256: string
    readonly canonicalRendererPlanDigestSha256: string
    readonly rendererPlanBindingDigestSha256: string
    readonly choreographyBindingDigestSha256: string
  }
  readonly rendererLayerLineage:
    readonly LivingFrameApprovedLayerLineage[]
  readonly bindingState: LivingFrameApprovedLineageState
  readonly openGateCodes:
    readonly LivingFrameApprovedLineageOpenGate[]
  readonly metrics: LivingFrameApprovedLineageMetrics
  readonly authorityBoundary:
    LivingFrameApprovedLineageAuthorityBoundary
  readonly canonicalApprovedSnapshotWasReadByRegisteredServerPort: true
  readonly existingCanonicalSnapshotRemainsImmutable: true
  readonly existingCanonicalWorkGraphRemainsAuthority: true
  readonly existingCanonicalAssetManifestRemainsAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolJobQueueCostOrCommercialRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
}

export interface LivingFrameApprovedLineageBinding
  extends LivingFrameApprovedLineageBindingDraft {
  readonly bindingDigestSha256: string
}
