import type {
  LivingFrameGeometryExpectationRef,
} from './living-frame-component-geometry'
import type {
  LivingFrameRiggingDirection,
} from './living-frame-rigging-direction'
import type {
  LivingFrameRiggingV2Backend,
  LivingFrameRiggingV2Plan,
} from './living-frame-rigging-v2'

export const LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_VERSION =
  'living-frame-rigging-adapter-candidate-v1' as const

export const LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_CLASS =
  'private_non_executable_fixed_adapter_materialization_candidate' as const

export const LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_BACKENDS = [
  'blender_headless_candidate',
  'opentoonz_plastic_candidate',
] as const satisfies readonly LivingFrameRiggingV2Backend[]
export type LivingFrameRiggingAdapterCandidateBackend =
  (typeof LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_BACKENDS)[number]

export const LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_TOOL_IDS = [
  'blender',
  'opentoonz',
] as const
export type LivingFrameRiggingAdapterCandidateToolId =
  (typeof LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_TOOL_IDS)[number]

export const LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_OPERATION_IDS = [
  'tool.blender.render_living_frame_component_rig.v1',
  'tool.opentoonz.render_living_frame_plastic_component_rig.v1',
] as const
export type LivingFrameRiggingAdapterCandidateOperationId =
  (typeof LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_OPERATION_IDS)[number]

export interface LivingFrameRiggingAdapterCandidateSourceBindings {
  readonly approvedSnapshotRef: LivingFrameGeometryExpectationRef
  readonly selectedSceneRef: LivingFrameGeometryExpectationRef
  readonly plannedWorkItemRef: LivingFrameGeometryExpectationRef
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly riggingDirectionDigestSha256: string
  readonly riggingPlanDigestSha256: string
}

export interface LivingFrameRiggingFixedAdapterBinding {
  readonly backend: LivingFrameRiggingAdapterCandidateBackend
  readonly candidateToolId: LivingFrameRiggingAdapterCandidateToolId
  readonly candidateOperationId:
    LivingFrameRiggingAdapterCandidateOperationId
  readonly adapterKnowledgeProfile:
    | 'blender_armature_ik_skinning_2_5d_knowledge_v1'
    | 'opentoonz_plastic_mesh_skeleton_knowledge_v1'
  readonly fixedAdapterProfile:
    | 'server_owned_fixed_bpy_rig_adapter_v1'
    | 'server_owned_fixed_opentoonz_scene_adapter_v1'
  readonly structuredInputMode: 'strict_typed_rig_plan_json'
  readonly blenderPythonAdapterMode:
    | 'fixed_reviewed_bpy_adapter'
    | 'not_applicable'
  readonly openToonzAdapterMode:
    | 'fixed_reviewed_scene_and_batch_adapter'
    | 'not_applicable'
  readonly serverDerivedAdapterSelection: true
  readonly callerScriptAllowed: false
  readonly callerCommandOrArgumentsAllowed: false
  readonly callerPathsUrlsEnvironmentOrCredentialsAllowed: false
  readonly modelGeneratedExecutableCodeAllowed: false
  readonly arbitraryNodesPluginsOrExtensionsAllowed: false
  readonly finalCanvasDelegationAllowed: false
}

export interface LivingFrameRiggingAdapterQualificationPlan {
  readonly state: 'internal_source_and_runtime_qualification_required'
  readonly requiredEvidence:
    readonly (
      | 'pinned_source_and_license_disposition'
      | 'signed_scanned_non_root_offline_image'
      | 'fixed_adapter_source_review_and_digest'
      | 'cold_and_warm_start_measurement'
      | 'rig_compile_measurement'
      | 'blocking_preview_measurement'
      | 'full_quality_component_render_measurement'
      | 'peak_memory_and_output_byte_measurement'
      | 'exact_rig_digest_cache_reuse_measurement'
      | 'transparent_alpha_output_evidence'
      | 'part_boundary_pivot_joint_and_mesh_qa'
      | 'temporal_jitter_and_deformation_qa'
      | 'private_artifact_persistence_and_reread'
      | 'canonical_cost_resource_receipt'
    )[]
  readonly blenderCapabilityEvidenceRequired:
    readonly (
      | 'background_headless_execution'
      | 'python_api_armature_creation'
      | 'bone_constraints_and_inverse_kinematics'
      | 'mesh_skinning_and_weight_binding'
      | 'transparent_component_and_depth_pass_render'
    )[]
  readonly openToonzCapabilityEvidenceRequired:
    readonly (
      | 'plastic_triangular_mesh_creation'
      | 'plastic_skeleton_and_angle_bounds'
      | 'plastic_rigidity_and_stacking_order'
      | 'fixed_scene_materialization'
      | 'batch_transparent_component_render'
    )[]
  readonly latencyClaimAllowed: false
  readonly internalPrivateBenchmarkOnly: true
  readonly candidateFailureReturnsToApprovedFallbackResolver: true
}

export interface LivingFrameRiggingAdapterOutputSelection {
  readonly approvedRiggedComponentIds: readonly string[]
  readonly excludedStaticAnchorComponentIds: readonly string[]
  readonly outputLayerGrouping:
    'one_confirmed_frame_sized_transparent_sequence_per_component'
  readonly sourceOrBackgroundPlateIncluded: false
  readonly fullFrameOpaqueOutputAllowed: false
  readonly confirmedFrameSizedTransparentCanvasRequired: true
  readonly alphaRequired: true
  readonly depthAndMaskPassesFollowRigPlan: true
}

export interface LivingFrameRiggingAdapterCandidateAuthorityBoundary {
  readonly materializationCandidateOnly: true
  readonly toolIdentityCreationAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly approvedSnapshotAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly workerLeaseAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeExecutionAuthority: false
  readonly assetPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly qaApprovalAuthority: false
  readonly rendererAuthority: false
  readonly finalCanvasAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRiggingAdapterCandidateRequestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_VERSION
  readonly requestClass:
    typeof LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_CLASS
  readonly sourceBindings:
    LivingFrameRiggingAdapterCandidateSourceBindings
  readonly riggingDirection: LivingFrameRiggingDirection
  readonly riggingPlan: LivingFrameRiggingV2Plan
  readonly adapterBinding: LivingFrameRiggingFixedAdapterBinding
  readonly outputSelection: LivingFrameRiggingAdapterOutputSelection
  readonly qualificationPlan:
    LivingFrameRiggingAdapterQualificationPlan
  readonly authorityBoundary:
    LivingFrameRiggingAdapterCandidateAuthorityBoundary
  readonly containsExecutableCodeScriptCommandOrArguments: false
  readonly containsCallerPathsUrlsEnvironmentCredentialsOrMediaBytes: false
  readonly currentSnapshotSceneWorkTimingAndFrameRevalidationRequired: true
  readonly runtimeImageAdapterAndToolEvidenceStillRequired: true
  readonly canonicalAdmissionDispatchAssetCostAndReviewStillRequired: true
}

export interface LivingFrameRiggingAdapterCandidateRequest
  extends LivingFrameRiggingAdapterCandidateRequestDraft {
  readonly requestDigestSha256: string
}
