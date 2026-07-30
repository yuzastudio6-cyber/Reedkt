import type {
  LivingFrameComponentRole,
  LivingFrameFocalRole,
  LivingFrameMiniSkillKey,
} from './living-frame'
import type {
  CanonicalLivingFrameRenderableMotionProperty,
} from './living-frame-canonical-motion'

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_VERSION =
  'living-frame-selected-scene-selective-motion-reconciliation-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_CLASS =
  'server_derived_read_only_component_role_activation_motion_reconciliation_candidate' as const

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_STATE =
  'canonical_scene_verb_broadcast_observed_component_selective_motion_integration_pending' as const

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_STATUSES = [
  'exact_role_activation_match',
  'blocked_unselected_component_rotation',
  'blocked_required_mechanical_rotation_missing',
  'blocked_environmental_component_receives_mechanical_rotation',
  'blocked_environmental_motion_runtime_unsupported',
] as const

export type LivingFrameSelectedSceneSelectiveMotionReconciliationStatus =
  (typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_STATUSES)[number]

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_OPEN_GATES = [
  'canonical_motion_derivation_must_be_component_role_and_activation_aware',
  'canonical_static_anchor_rotation_broadcast_must_be_removed',
  'canonical_environmental_motion_primitive_or_approved_fallback_required',
  'canonical_component_rig_pivot_binding_required_before_rotation_render',
  'canonical_work_graph_motion_admission_binding_required',
  'canonical_private_review_selective_motion_evidence_required',
] as const

export type LivingFrameSelectedSceneSelectiveMotionReconciliationOpenGate =
  (typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_OPEN_GATES)[number]

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_OBSERVATIONS = [
  'scene_level_rotation_broadcast_to_unselected_component',
  'static_anchor_receives_mechanical_rotation',
  'environmental_component_receives_mechanical_rotation',
  'required_mechanical_component_rotation_missing',
  'environmental_particle_motion_not_renderable',
] as const

export type LivingFrameSelectedSceneSelectiveMotionObservation =
  (typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_OBSERVATIONS)[number]

export const LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_ISSUE_CODES = [
  'input_invalid',
  'selected_component_invalid',
  'canonical_motion_spec_invalid',
  'source_lineage_mismatch',
  'scene_or_component_mismatch',
  'missing_motion_spec',
  'duplicate_motion_spec',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameSelectedSceneSelectiveMotionReconciliationIssueCode =
  (typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_ISSUE_CODES)[number]

export interface LivingFrameSelectedSceneSelectiveMotionReconciliationAuthority {
  readonly readOnlySelectiveMotionReconciliationAuthority: true
  readonly selectedSceneAuthority: false
  readonly miniSkillSelectionAuthority: false
  readonly motionPlanningAuthority: false
  readonly motionSpecMutationAuthority: false
  readonly componentRigAuthority: false
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

export interface LivingFrameSelectedSceneSelectiveMotionReconciliationUnit {
  readonly order: number
  readonly reconciliationUnitId: string
  readonly sceneId: string
  readonly componentId: string
  readonly role: LivingFrameComponentRole
  readonly focalRole: LivingFrameFocalRole
  readonly linkedMiniSkillKeys: readonly LivingFrameMiniSkillKey[]
  readonly selectedMotionIntent: {
    readonly mechanicalPartMotionSelected: boolean
    readonly environmentalMotionSelected: boolean
    readonly staticAnchor: boolean
    readonly mechanicalRotationAllowed: boolean
    readonly mechanicalRotationRequired: boolean
    readonly environmentalParticleOrApprovedFallbackRequired:
      boolean
  }
  readonly canonicalMotionObservation: {
    readonly motionSpecDigestSha256: string
    readonly currentProperties:
      readonly CanonicalLivingFrameRenderableMotionProperty[]
    readonly currentRotationTrackCount: number
    readonly currentParticleEmissionTrackCount: 0
    readonly sceneVisualVerbAppliedAtComponentCompiler: true
  }
  readonly observationCodes:
    readonly LivingFrameSelectedSceneSelectiveMotionObservation[]
  readonly reconciliationStatus:
    LivingFrameSelectedSceneSelectiveMotionReconciliationStatus
  readonly requiredCanonicalCorrection: {
    readonly deriveTracksFromComponentRoleAndLinkedActivation: true
    readonly keepStaticAnchorUnrotated: boolean
    readonly removeMechanicalRotation: boolean
    readonly addMechanicalRotation: boolean
    readonly requireEnvironmentalPrimitiveOrApprovedFallback:
      boolean
    readonly requireComponentRigPivotBeforeRotationRender:
      boolean
    readonly exactValuesRemainCanonicalMotionOwnerDecision: true
  }
  readonly downstreamCanonicalMotionAdmissionBlocked:
    boolean
  readonly canonicalMotionSpecMutated: false
  readonly selectedSceneMutated: false
  readonly reconciliationUnitDigestSha256: string
}

export interface LivingFrameSelectedSceneSelectiveMotionReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_CLASS
  readonly reconciliationState:
    typeof LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_STATE
  readonly reconciliationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly livingFrameComponentDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly timingBindingDigestSha256: string
  }
  readonly units:
    readonly LivingFrameSelectedSceneSelectiveMotionReconciliationUnit[]
  readonly metrics: {
    readonly unitCount: number
    readonly exactMatchCount: number
    readonly blockedCount: number
    readonly rotationTrackCount: number
    readonly expectedMechanicalRotationComponentCount: number
    readonly unexpectedRotationComponentCount: number
    readonly missingMechanicalRotationComponentCount: number
    readonly environmentalRuntimeGapCount: number
  }
  readonly allUnitsRoleActivationMatched: boolean
  readonly canonicalSceneVerbBroadcastConflictObserved: boolean
  readonly staticAnchorRotationConflictObserved: boolean
  readonly environmentalMotionRuntimeGapObserved: boolean
  readonly canonicalSelectiveMotionCanProceedByThisReconciliation:
    false
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
    readonly LivingFrameSelectedSceneSelectiveMotionReconciliationOpenGate[]
  readonly authorityBoundary:
    LivingFrameSelectedSceneSelectiveMotionReconciliationAuthority
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneSelectiveMotionReconciliation
  extends LivingFrameSelectedSceneSelectiveMotionReconciliationDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameSelectedSceneSelectiveMotionReconciliationIssue {
  readonly code:
    LivingFrameSelectedSceneSelectiveMotionReconciliationIssueCode
  readonly path: string
}
