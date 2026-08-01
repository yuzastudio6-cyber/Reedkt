import type {
  LivingFrameGeometryExpectationRef,
  LivingFrameNormalizedPoint,
} from './living-frame-component-geometry'

export const LIVING_FRAME_RIGGING_V2_VERSION =
  'living-frame-rigging-plan-v2' as const

export const LIVING_FRAME_RIGGING_V2_PROFILE =
  'provider_neutral_hybrid_rigging_v2' as const

export const LIVING_FRAME_RIGGING_V2_CLASS =
  'controlled_non_executable_rigging_plan' as const

export const LIVING_FRAME_RIGGING_V2_MODES = [
  'native_rigid_transform',
  'native_hierarchical_cutout',
  'mechanical_linkage',
  'deformable_2d_character',
  'armature_2_5d_character',
] as const
export type LivingFrameRiggingV2Mode =
  (typeof LIVING_FRAME_RIGGING_V2_MODES)[number]

export const LIVING_FRAME_RIGGING_V2_PART_ROLES = [
  'static_anchor',
  'rigid_part',
  'deformable_part',
  'mechanical_driver',
  'mechanical_follower',
  'secondary_motion_part',
] as const
export type LivingFrameRiggingV2PartRole =
  (typeof LIVING_FRAME_RIGGING_V2_PART_ROLES)[number]

export const LIVING_FRAME_RIGGING_V2_CAPABILITIES = [
  'rigid_transform',
  'parent_hierarchy',
  'bone_chain',
  'joint_limits',
  'inverse_kinematics',
  'mesh_deformation',
  'skin_weights',
  'rigidity_map',
  'stacking_order',
  'mechanical_linkage',
  'secondary_motion',
  'depth_camera',
  'transparent_layer_output',
] as const
export type LivingFrameRiggingV2Capability =
  (typeof LIVING_FRAME_RIGGING_V2_CAPABILITIES)[number]

export const LIVING_FRAME_RIGGING_V2_BACKENDS = [
  'reeditpro_native_remotion',
  'blender_headless_candidate',
  'opentoonz_plastic_candidate',
] as const
export type LivingFrameRiggingV2Backend =
  (typeof LIVING_FRAME_RIGGING_V2_BACKENDS)[number]

export const LIVING_FRAME_RIGGING_V2_BACKEND_DISPOSITIONS = [
  'selected_native',
  'evaluation_candidate',
  'incompatible',
] as const
export type LivingFrameRiggingV2BackendDisposition =
  (typeof LIVING_FRAME_RIGGING_V2_BACKEND_DISPOSITIONS)[number]

export const LIVING_FRAME_RIGGING_V2_CONTROL_KINDS = [
  'root',
  'transform_handle',
  'ik_target',
  'pole_target',
  'mechanical_driver',
] as const
export type LivingFrameRiggingV2ControlKind =
  (typeof LIVING_FRAME_RIGGING_V2_CONTROL_KINDS)[number]

export const LIVING_FRAME_RIGGING_V2_CONSTRAINT_KINDS = [
  'limit_rotation',
  'maintain_distance',
  'copy_transform',
  'ik_target',
  'mechanical_ratio',
] as const
export type LivingFrameRiggingV2ConstraintKind =
  (typeof LIVING_FRAME_RIGGING_V2_CONSTRAINT_KINDS)[number]

export const LIVING_FRAME_RIGGING_V2_MESH_TOPOLOGIES = [
  'triangulated_2d',
  'skinned_plane_2_5d',
] as const
export type LivingFrameRiggingV2MeshTopology =
  (typeof LIVING_FRAME_RIGGING_V2_MESH_TOPOLOGIES)[number]

export const LIVING_FRAME_RIGGING_V2_SECONDARY_MOTION_PROFILES = [
  'hair_follow',
  'fabric_follow',
  'tail_follow',
  'mechanical_vibration',
] as const
export type LivingFrameRiggingV2SecondaryMotionProfile =
  (typeof LIVING_FRAME_RIGGING_V2_SECONDARY_MOTION_PROFILES)[number]

export const LIVING_FRAME_RIGGING_V2_OUTPUT_MODES = [
  'native_transform_spec_json',
  'transparent_rgba_component_sequence',
  'transparent_rgba_component_sequence_with_depth_and_mask',
] as const
export type LivingFrameRiggingV2OutputMode =
  (typeof LIVING_FRAME_RIGGING_V2_OUTPUT_MODES)[number]

export interface LivingFrameRiggingV2SourceBindings {
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly geometryBundleVersion: 'living-frame-component-geometry-v1'
  readonly geometryBundleDigestSha256: string
  readonly motionBundleVersion: 'living-frame-deterministic-motion-v1'
  readonly motionBundleDigestSha256: string
  readonly componentRigVersion: 'living-frame-component-rig-v1'
  readonly componentRigDigestSha256: string
  readonly riggingDirectionVersion: 'living-frame-rigging-direction-v1'
  readonly riggingDirectionDigestSha256: string
}

export interface LivingFrameRiggingV2PartBinding {
  readonly order: number
  readonly partId: string
  readonly componentId: string
  readonly partRole: LivingFrameRiggingV2PartRole
  readonly deformable: boolean
  readonly partProposalConfidence: number
  readonly manualPartReviewRequired: boolean
  readonly occludedAreaReconstructionRequired: boolean
  readonly decompositionEvidenceRef: LivingFrameGeometryExpectationRef
}

export interface LivingFrameRiggingV2Bone {
  readonly order: number
  readonly boneId: string
  readonly componentId: string
  readonly parentBoneId: string | null
  readonly head: LivingFrameNormalizedPoint
  readonly tail: LivingFrameNormalizedPoint
  readonly restLengthNormalized: number
  readonly restAngleDegrees: number
  readonly deformComponent: boolean
}

export interface LivingFrameRiggingV2Joint {
  readonly order: number
  readonly jointId: string
  readonly boneId: string
  readonly pivot: LivingFrameNormalizedPoint
  readonly minimumAngleDegrees: number
  readonly maximumAngleDegrees: number
  readonly restAngleDegrees: number
  readonly allowStretching: boolean
  readonly stiffnessNormalized: number
}

export interface LivingFrameRiggingV2Control {
  readonly order: number
  readonly controlId: string
  readonly kind: LivingFrameRiggingV2ControlKind
  readonly targetBoneId: string | null
  readonly position: LivingFrameNormalizedPoint
}

export interface LivingFrameRiggingV2Constraint {
  readonly order: number
  readonly constraintId: string
  readonly kind: LivingFrameRiggingV2ConstraintKind
  readonly sourceRefId: string
  readonly targetRefId: string
  readonly influenceNormalized: number
  readonly minimumValue: number | null
  readonly maximumValue: number | null
}

export interface LivingFrameRiggingV2IkChain {
  readonly order: number
  readonly chainId: string
  readonly rootBoneId: string
  readonly effectorBoneId: string
  readonly targetControlId: string
  readonly poleControlId: string | null
  readonly chainLength: number
  readonly solverIterationLimit: number
  readonly toleranceNormalized: number
}

export interface LivingFrameRiggingV2ArtifactRef {
  readonly artifactId: string
  readonly artifactVersion: string
  readonly artifactDigestSha256: string
  readonly contentType: 'application/json'
  readonly currentArtifactRevalidationRequired: true
}

export interface LivingFrameRiggingV2MeshBinding {
  readonly order: number
  readonly meshId: string
  readonly componentId: string
  readonly topology: LivingFrameRiggingV2MeshTopology
  readonly topologyArtifactRef: LivingFrameRiggingV2ArtifactRef
  readonly vertexCount: number
  readonly triangleCount: number
  readonly weightMapArtifactRef: LivingFrameRiggingV2ArtifactRef | null
  readonly rigidityMapArtifactRef: LivingFrameRiggingV2ArtifactRef | null
  readonly animatedStackingOrderRequired: boolean
}

export interface LivingFrameRiggingV2MechanicalLinkage {
  readonly order: number
  readonly linkageId: string
  readonly driverComponentId: string
  readonly driverMotionTrackId: string
  readonly drivenComponentIds: readonly string[]
  readonly relationship:
    | 'rotation_ratio'
    | 'translation_ratio'
    | 'reciprocal_link'
  readonly ratio: number
  readonly phaseOffsetDegrees: number
  readonly exactPivotVerificationRequired: true
}

export interface LivingFrameRiggingV2SecondaryMotionGroup {
  readonly order: number
  readonly groupId: string
  readonly profile: LivingFrameRiggingV2SecondaryMotionProfile
  readonly driverPartId: string
  readonly followerPartIds: readonly string[]
  readonly stiffnessNormalized: number
  readonly dampingNormalized: number
  readonly maximumDisplacementNormalized: number
  readonly deterministicBakeRequired: true
}

export interface LivingFrameRiggingV2BackendCandidate {
  readonly order: number
  readonly candidateId: string
  readonly backend: LivingFrameRiggingV2Backend
  readonly disposition: LivingFrameRiggingV2BackendDisposition
  readonly supportedCapabilities:
    readonly LivingFrameRiggingV2Capability[]
  readonly unsupportedRequiredCapabilities:
    readonly LivingFrameRiggingV2Capability[]
  readonly purpose:
    | 'native_deterministic_transform_and_cutout'
    | 'advanced_armature_ik_skinning_and_2_5d'
    | 'specialized_flat_2d_plastic_deformation'
  readonly benchmarkRequiredBeforeRuntimeSelection: boolean
  readonly toolIdentityCreationAuthority: false
  readonly operationRegistrationAuthority: false
  readonly runtimeExecutionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRiggingV2RoutingRecommendation {
  readonly recommendedBackend: LivingFrameRiggingV2Backend
  readonly recommendationReason:
    | 'native_capabilities_sufficient'
    | 'flat_2d_mesh_deformation_candidate'
    | 'advanced_armature_or_2_5d_candidate'
  readonly externalBackendStillEvaluationOnly: boolean
  readonly runtimeSelectionStillRequired: boolean
  readonly remotionOwnsFinalCanvas: true
}

export interface LivingFrameRiggingV2OutputContract {
  readonly outputMode: LivingFrameRiggingV2OutputMode
  readonly widthPixels: number
  readonly heightPixels: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly outputContainsOnlyApprovedComponentLayers: true
  readonly outputMayClaimFinalCanvas: false
  readonly transparentAlphaRequired: boolean
  readonly depthPassRequired: boolean
  readonly maskPassRequired: boolean
  readonly remotionOwnsFinalComposition: true
}

export interface LivingFrameRiggingV2PerformanceQualification {
  readonly state:
    | 'bounded_native_fixture_evidence_only'
    | 'internal_benchmark_required'
  readonly latencyClaimAllowed: false
  readonly requiredMeasurements: readonly [
    'cold_start_duration_ms',
    'warm_start_duration_ms',
    'rig_compile_duration_ms',
    'preview_render_duration_ms',
    'full_quality_render_duration_ms',
    'peak_memory_bytes',
    'output_bytes',
    'cache_reuse_result',
  ]
  readonly exactRigDigestCacheKeyRequired: true
  readonly lowResolutionBlockingPreviewRequiredForExternalRuntime: boolean
  readonly sceneOnlyExecutionRequired: true
  readonly unrelatedEditChangeMayInvalidateRigCache: false
}

export interface LivingFrameRiggingV2QaPlan {
  readonly partBoundaryQaRequired: true
  readonly pivotAndJointQaRequired: true
  readonly jointLimitQaRequired: boolean
  readonly skinWeightQaRequired: boolean
  readonly meshFoldoverQaRequired: boolean
  readonly ikConvergenceQaRequired: boolean
  readonly mechanicalLinkageQaRequired: boolean
  readonly secondaryMotionQaRequired: boolean
  readonly temporalJitterQaRequired: true
  readonly alphaEdgeQaRequired: true
  readonly depthAndOcclusionQaRequired: boolean
  readonly outputFrameQaRequired: true
  readonly captionAndProtectedRegionQaRequired: true
  readonly sourceLineageQaRequired: true
  readonly performanceBenchmarkQaRequired: boolean
}

export interface LivingFrameRiggingV2FallbackPolicy {
  readonly orderedFallbacks: readonly [
    'approved_advanced_rig',
    'native_hierarchical_cutout',
    'native_rigid_transform',
    'static_living_frame_component',
    'no_extra_visual',
  ]
  readonly fallbackMayChangeMasterTiming: false
  readonly fallbackMayChangeFinalCanvasOwner: false
  readonly fallbackBeyondApprovedScopeRequiresNewApproval: true
}

export interface LivingFrameRiggingV2Metrics {
  readonly partCount: number
  readonly deformablePartCount: number
  readonly boneCount: number
  readonly jointCount: number
  readonly controlCount: number
  readonly constraintCount: number
  readonly ikChainCount: number
  readonly meshCount: number
  readonly mechanicalLinkageCount: number
  readonly secondaryMotionGroupCount: number
  readonly manualPartReviewCount: number
  readonly requiredCapabilityCount: number
}

export interface LivingFrameRiggingV2AuthorityBoundary {
  readonly deterministicRigPlanCompilationOnly: true
  readonly componentDecompositionAuthority: false
  readonly selectedSceneAuthority: false
  readonly outputFrameAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly runtimeSelectionAuthority: false
  readonly workerLeaseAuthority: false
  readonly dispatchAuthority: false
  readonly assetPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly qaApprovalAuthority: false
  readonly rendererAuthority: false
  readonly finalCanvasAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRiggingV2PlanDraft {
  readonly contractVersion: typeof LIVING_FRAME_RIGGING_V2_VERSION
  readonly riggingProfile: typeof LIVING_FRAME_RIGGING_V2_PROFILE
  readonly planClass: typeof LIVING_FRAME_RIGGING_V2_CLASS
  readonly sourceBindings: LivingFrameRiggingV2SourceBindings
  readonly rigMode: LivingFrameRiggingV2Mode
  readonly requiredCapabilities:
    readonly LivingFrameRiggingV2Capability[]
  readonly partBindings: readonly LivingFrameRiggingV2PartBinding[]
  readonly bones: readonly LivingFrameRiggingV2Bone[]
  readonly joints: readonly LivingFrameRiggingV2Joint[]
  readonly controls: readonly LivingFrameRiggingV2Control[]
  readonly constraints: readonly LivingFrameRiggingV2Constraint[]
  readonly ikChains: readonly LivingFrameRiggingV2IkChain[]
  readonly meshBindings: readonly LivingFrameRiggingV2MeshBinding[]
  readonly mechanicalLinkages:
    readonly LivingFrameRiggingV2MechanicalLinkage[]
  readonly secondaryMotionGroups:
    readonly LivingFrameRiggingV2SecondaryMotionGroup[]
  readonly backendCandidates:
    readonly LivingFrameRiggingV2BackendCandidate[]
  readonly routingRecommendation:
    LivingFrameRiggingV2RoutingRecommendation
  readonly outputContract: LivingFrameRiggingV2OutputContract
  readonly performanceQualification:
    LivingFrameRiggingV2PerformanceQualification
  readonly qaPlan: LivingFrameRiggingV2QaPlan
  readonly fallbackPolicy: LivingFrameRiggingV2FallbackPolicy
  readonly metrics: LivingFrameRiggingV2Metrics
  readonly authorityBoundary: LivingFrameRiggingV2AuthorityBoundary
  readonly containsExecutableCodeCommandsPathsUrlsOrCredentials: false
  readonly containsRawChatTranscriptOrMediaBytes: false
  readonly externalRuntimeExecutionAuthorized: false
  readonly toolRegistryMutationRequested: false
  readonly currentSourceLineageRevalidationStillRequired: true
  readonly canonicalWorkAssetAndReviewAdmissionStillRequired: true
}

export interface LivingFrameRiggingV2Plan
  extends LivingFrameRiggingV2PlanDraft {
  readonly planDigestSha256: string
}
