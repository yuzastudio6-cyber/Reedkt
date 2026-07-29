import type {
  CanonicalLivingFrameDepthStyle,
} from './living-frame-canonical-motion'
import type {
  LivingFrameControlledImageSelectedSceneMotionPreparationClass,
} from './living-frame-controlled-image-selected-scene-private-conditioning-binding'
import type {
  LivingFrameVisualContinuityAssetTreatment,
  LivingFrameVisualContinuityDepthStyle,
} from './living-frame-visual-continuity'

export const LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_VERSION =
  'living-frame-selected-scene-motion-style-reconciliation-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_CLASS =
  'server_derived_read_only_selected_scene_motion_style_reconciliation_candidate' as const

export const LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_STATE =
  'exact_matches_observed_conflicts_fail_closed_canonical_integration_pending' as const

export const LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_STATUSES = [
  'exact_supported_style_match',
  'blocked_canonical_motion_style_mismatch',
  'blocked_dimensional_motion_runtime_unsupported',
] as const

export type LivingFrameSelectedSceneMotionStyleReconciliationStatus =
  (typeof LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_STATUSES)[number]

export const LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_OPEN_GATES = [
  'canonical_selected_scene_design_depth_binding_required',
  'canonical_motion_must_consume_exact_approved_depth_or_explicit_approved_downgrade',
  'canonical_dimensional_motion_and_renderer_contract_required',
  'canonical_work_graph_motion_admission_binding_required',
  'canonical_private_review_motion_style_evidence_required',
  'new_approval_required_for_any_depth_style_downgrade',
] as const

export type LivingFrameSelectedSceneMotionStyleReconciliationOpenGate =
  (typeof LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_OPEN_GATES)[number]

export const LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_ISSUE_CODES = [
  'input_invalid',
  'conditioning_binding_invalid',
  'canonical_motion_spec_invalid',
  'source_lineage_mismatch',
  'scene_component_or_output_mismatch',
  'missing_motion_spec',
  'duplicate_motion_spec',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameSelectedSceneMotionStyleReconciliationIssueCode =
  (typeof LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_ISSUE_CODES)[number]

export interface LivingFrameSelectedSceneMotionStyleReconciliationAuthority {
  readonly readOnlyMotionStyleReconciliationAuthority: true
  readonly selectedSceneAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly sceneDesignAuthority: false
  readonly motionPlanningAuthority: false
  readonly motionSpecMutationAuthority: false
  readonly depthDowngradeAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly rendererAuthority: false
  readonly privateReviewAuthority: false
  readonly operationRegistryAuthority: false
  readonly toolRegistryAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSelectedSceneMotionStyleReconciliationUnit {
  readonly order: number
  readonly reconciliationUnitId: string
  readonly conditioningUnitId: string
  readonly requestUnitId: string
  readonly sceneId: string
  readonly componentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly approvedStyle: {
    readonly assetTreatment:
      LivingFrameVisualContinuityAssetTreatment
    readonly depthStyle:
      LivingFrameVisualContinuityDepthStyle
    readonly motionPreparationClass:
      LivingFrameControlledImageSelectedSceneMotionPreparationClass
    readonly twoPointFiveDDirected: boolean
  }
  readonly canonicalMotionObservation: {
    readonly motionSpecDigestSha256: string
    readonly depthStyle: CanonicalLivingFrameDepthStyle
    readonly depthBand: string
    readonly parallaxFactor: number
    readonly layerTrackCount: number
    readonly cameraTrackCount: number
    readonly sourceTrackCount: number
  }
  readonly reconciliationStatus:
    LivingFrameSelectedSceneMotionStyleReconciliationStatus
  readonly exactDepthStyleMatch: boolean
  readonly approvedDepthStyleSupportedByCurrentCanonicalMotion:
    boolean
  readonly explicitApprovedDowngradePresent: false
  readonly downstreamCanonicalMotionAdmissionBlocked:
    boolean
  readonly canonicalMotionSpecMutated: false
  readonly approvedStyleMutated: false
  readonly reconciliationUnitDigestSha256: string
}

export interface LivingFrameSelectedSceneMotionStyleReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_CLASS
  readonly reconciliationState:
    typeof LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_STATE
  readonly reconciliationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly privateConditioningBindingDigestSha256: string
    readonly visualContinuityPackBindingDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
  }
  readonly units:
    readonly LivingFrameSelectedSceneMotionStyleReconciliationUnit[]
  readonly metrics: {
    readonly unitCount: number
    readonly exactMatchCount: number
    readonly styleMismatchCount: number
    readonly dimensionalUnsupportedCount: number
    readonly blockedCount: number
  }
  readonly allUnitsExactSupportedStyleMatch: boolean
  readonly canonicalMotionCanProceedByThisReconciliation: false
  readonly canonicalMotionStyleConflictObserved: boolean
  readonly dimensionalRuntimeGapObserved: boolean
  readonly explicitApprovedDowngradeRequiredForAnyMismatch: true
  readonly canonicalSelectedSceneOrMotionInterfaceMutated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly openGateCodes:
    readonly LivingFrameSelectedSceneMotionStyleReconciliationOpenGate[]
  readonly authorityBoundary:
    LivingFrameSelectedSceneMotionStyleReconciliationAuthority
  readonly containsRawPromptPackPayloadMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneMotionStyleReconciliation
  extends LivingFrameSelectedSceneMotionStyleReconciliationDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameSelectedSceneMotionStyleReconciliationIssue {
  readonly code:
    LivingFrameSelectedSceneMotionStyleReconciliationIssueCode
  readonly path: string
}
