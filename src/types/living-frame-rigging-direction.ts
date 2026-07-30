import type {
  LivingFrameGeometryExpectationRef,
} from './living-frame-component-geometry'
import type {
  LivingFrameRiggingV2Backend,
  LivingFrameRiggingV2Capability,
  LivingFrameRiggingV2Mode,
} from './living-frame-rigging-v2'

export const LIVING_FRAME_RIGGING_DIRECTION_VERSION =
  'living-frame-rigging-direction-v1' as const

export const LIVING_FRAME_RIGGING_DIRECTION_PROFILE =
  'head_intelligence_professional_rig_direction_v1' as const

export const LIVING_FRAME_RIGGING_DIRECTION_CLASS =
  'structured_non_executable_rigging_direction' as const

export const LIVING_FRAME_RIGGING_DIRECTION_REASONING_ROLES = [
  'kimi_k3_main_edit_agent',
  'qwen_3_7_main_edit_agent',
  'deepseek_v4_tool_code_agent',
] as const
export type LivingFrameRiggingDirectionReasoningRole =
  (typeof LIVING_FRAME_RIGGING_DIRECTION_REASONING_ROLES)[number]

export const LIVING_FRAME_RIGGING_DIRECTION_PURPOSES = [
  'activate_mechanical_life',
  'demonstrate_articulated_action',
  'support_character_gesture',
  'create_environmental_response',
  'express_symbolic_motion',
] as const
export type LivingFrameRiggingDirectionPurpose =
  (typeof LIVING_FRAME_RIGGING_DIRECTION_PURPOSES)[number]

export const LIVING_FRAME_RIGGING_DIRECTION_VISUAL_VERBS = [
  'rotate',
  'reach',
  'point',
  'bend',
  'follow',
  'settle',
  'vibrate',
  'recoil',
  'walk',
  'turn',
  'orbit',
  'custom_directed_motion',
] as const
export type LivingFrameRiggingDirectionVisualVerb =
  (typeof LIVING_FRAME_RIGGING_DIRECTION_VISUAL_VERBS)[number]

export const LIVING_FRAME_RIGGING_DIRECTION_IMPORTANCE_LEVELS = [
  'support',
  'important',
  'hero',
] as const
export type LivingFrameRiggingDirectionImportance =
  (typeof LIVING_FRAME_RIGGING_DIRECTION_IMPORTANCE_LEVELS)[number]

export const LIVING_FRAME_RIGGING_DIRECTION_ATTENTION_PRIORITIES = [
  'speaker_primary',
  'shared',
  'rigged_visual_primary',
] as const
export type LivingFrameRiggingDirectionAttentionPriority =
  (typeof LIVING_FRAME_RIGGING_DIRECTION_ATTENTION_PRIORITIES)[number]

export const LIVING_FRAME_RIGGING_DIRECTION_MOTION_PHASES = [
  'prepare',
  'activate',
  'demonstrate',
  'resolve',
  'settle',
] as const
export type LivingFrameRiggingDirectionMotionPhase =
  (typeof LIVING_FRAME_RIGGING_DIRECTION_MOTION_PHASES)[number]

export interface LivingFrameRiggingDirectionSourceBindings {
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly geometryBundleDigestSha256: string
  readonly motionBundleDigestSha256: string
  readonly componentRigDigestSha256: string
  readonly compiledIntentRef: LivingFrameGeometryExpectationRef
  readonly semanticScenePlanRef: LivingFrameGeometryExpectationRef
}

export interface LivingFrameRiggingDirectionHeadIntelligenceEvidence {
  readonly reasoningRole: LivingFrameRiggingDirectionReasoningRole
  readonly reasoningAttemptRef: LivingFrameGeometryExpectationRef
  readonly structuredOutputRef: LivingFrameGeometryExpectationRef
  readonly visualUnderstandingEvidenceRefs:
    readonly LivingFrameGeometryExpectationRef[]
  readonly rawChatPassedToRigWorker: false
  readonly rawModelCodeExecutionAllowed: false
}

export interface LivingFrameRiggingDirectionNarrativeDecision {
  readonly purpose: LivingFrameRiggingDirectionPurpose
  readonly visualVerb: LivingFrameRiggingDirectionVisualVerb
  readonly directedMotionSummary: string
  readonly importance: LivingFrameRiggingDirectionImportance
  readonly attentionPriority:
    LivingFrameRiggingDirectionAttentionPriority
  readonly primaryFocalComponentId: string
  readonly animateMeaningNotVocabulary: true
  readonly onePrimaryMotionAtATime: true
}

export interface LivingFrameRiggingDirectionMotionArcPhase {
  readonly order: number
  readonly phase: LivingFrameRiggingDirectionMotionPhase
  readonly phasePurpose:
    | 'prepare_space_and_attention'
    | 'begin_primary_action'
    | 'communicate_narrative_relationship'
    | 'complete_primary_action'
    | 'restore_or_hold_stable_state'
  readonly masterTimingOwnsExactFrames: true
}

export interface LivingFrameRiggingDirectionDesignDecision {
  readonly rigMode: LivingFrameRiggingV2Mode
  readonly requiredCapabilities:
    readonly LivingFrameRiggingV2Capability[]
  readonly recommendedBackend: LivingFrameRiggingV2Backend
  readonly simplerNativeRouteConsidered: true
  readonly simplerNativeRouteSufficient: boolean
  readonly externalRuntimeJustification:
    | 'not_required'
    | 'flat_2d_mesh_deformation_required'
    | 'armature_ik_skinning_or_2_5d_required'
  readonly partDecompositionRequired: boolean
  readonly skeletalDeformationRequired: boolean
  readonly inverseKinematicsRequired: boolean
  readonly depthCameraRequired: boolean
  readonly transparentComponentOutputRequired: boolean
  readonly finalCanvasDelegatedToRigTool: false
}

export interface LivingFrameRiggingDirectionCraftRules {
  readonly preserveRecognizableSilhouette: true
  readonly preserveApprovedPartBoundaries: true
  readonly usePhysicallyBelievablePivots: true
  readonly respectJointLimits: true
  readonly preventMeshFoldovers: true
  readonly avoidUnmotivatedMotion: true
  readonly avoidUniformWholeCharacterWobble: true
  readonly secondaryMotionMustFollowPrimaryMotion: true
  readonly stillnessRemainsAnIntentionalContrast: true
  readonly motionMustResolveOrSettle: true
  readonly preserveCaptionFaceGestureAndContactObjectSafety: true
}

export interface LivingFrameRiggingDirectionToolKnowledge {
  readonly nativeRemotionUse:
    'rigid_parts_hierarchy_pivots_tracks_and_mechanical_motion'
  readonly blenderUse:
    'armatures_skinning_ik_constraints_mesh_deformation_and_2_5d_camera'
  readonly openToonzPlasticUse:
    'flat_2d_triangular_mesh_skeleton_angle_rigidity_and_stacking'
  readonly blenderNotRequiredForSimpleRigidMotion: true
  readonly openToonzNotUsedForFinalCanvas: true
  readonly remotionOwnsFinalComposition: true
}

export interface LivingFrameRiggingDirectionRiskDecision {
  readonly thinStructureRisk:
    | 'none'
    | 'low'
    | 'medium'
    | 'high'
  readonly occludedPartRisk:
    | 'none'
    | 'low'
    | 'medium'
    | 'high'
  readonly deformationRisk:
    | 'none'
    | 'low'
    | 'medium'
    | 'high'
  readonly identityOrSilhouetteRisk:
    | 'none'
    | 'low'
    | 'medium'
    | 'high'
  readonly manualRigReviewRequired: boolean
  readonly lowConfidenceMayAutoExecute: false
}

export interface LivingFrameRiggingDirectionPerformanceDecision {
  readonly nativeRoutePreferredWhenProfessionallySufficient: true
  readonly externalRuntimeRunsSceneOnly: true
  readonly lowResolutionBlockingPreviewFirst: boolean
  readonly exactRigDigestCacheRequired: true
  readonly unrelatedCaptionOrAudioChangeMayInvalidateRigCache: false
  readonly latencyClaimRequiresMeasuredBenchmark: true
}

export interface LivingFrameRiggingDirectionAuthorityBoundary {
  readonly headIntelligenceRigDirectionOnly: true
  readonly componentEvidenceAuthority: false
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly workerDispatchAuthority: false
  readonly runtimeExecutionAuthority: false
  readonly assetPersistenceAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly qaApprovalAuthority: false
  readonly rendererAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRiggingDirectionDraft {
  readonly contractVersion: typeof LIVING_FRAME_RIGGING_DIRECTION_VERSION
  readonly directionProfile: typeof LIVING_FRAME_RIGGING_DIRECTION_PROFILE
  readonly directionClass: typeof LIVING_FRAME_RIGGING_DIRECTION_CLASS
  readonly sourceBindings: LivingFrameRiggingDirectionSourceBindings
  readonly headIntelligenceEvidence:
    LivingFrameRiggingDirectionHeadIntelligenceEvidence
  readonly narrativeDecision:
    LivingFrameRiggingDirectionNarrativeDecision
  readonly motionArc:
    readonly LivingFrameRiggingDirectionMotionArcPhase[]
  readonly designDecision:
    LivingFrameRiggingDirectionDesignDecision
  readonly craftRules: LivingFrameRiggingDirectionCraftRules
  readonly toolKnowledge: LivingFrameRiggingDirectionToolKnowledge
  readonly riskDecision: LivingFrameRiggingDirectionRiskDecision
  readonly performanceDecision:
    LivingFrameRiggingDirectionPerformanceDecision
  readonly authorityBoundary:
    LivingFrameRiggingDirectionAuthorityBoundary
  readonly containsExecutableCodeCommandsPathsUrlsOrCredentials: false
  readonly containsRawChatTranscriptOrMediaBytes: false
  readonly deterministicRigCompilerValidationStillRequired: true
  readonly canonicalSnapshotWorkAssetAndReviewAdmissionStillRequired: true
}

export interface LivingFrameRiggingDirection
  extends LivingFrameRiggingDirectionDraft {
  readonly directionDigestSha256: string
}
