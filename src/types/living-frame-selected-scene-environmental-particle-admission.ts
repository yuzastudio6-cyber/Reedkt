import type {
  LivingFrameDepthBand,
  LivingFrameFocalRole,
  LivingFrameTimingPhase,
} from './living-frame'
import type {
  LivingFrameNormalizedPoint,
  LivingFrameNormalizedRect,
} from './living-frame-component-geometry'

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_VERSION =
  'living-frame-selected-scene-environmental-particle-admission-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_CLASS =
  'server_derived_read_only_selected_scene_environmental_particle_operation_admission_candidate' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_STATE =
  'blocked_by_typed_effect_profile_pixi_sequence_and_remotion_sequence_interfaces' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_TOOL_ID =
  'pixijs' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CURRENT_OPERATION_ID =
  'tool.pixijs.render_pixi_scene.v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CANDIDATE_OPERATION_ID =
  'tool.pixijs.render_living_frame_environmental_particles.v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_MISMATCH_CODES = [
  'current_operation_fixed_to_640x360',
  'current_operation_fixed_to_opaque_panel',
  'current_operation_renders_one_static_png',
  'current_operation_has_no_typed_particle_profile',
  'current_operation_has_no_selected_scene_lineage',
  'current_remotion_overlay_input_accepts_one_static_png',
] as const

export type LivingFrameEnvironmentalParticleMismatchCode =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_MISMATCH_CODES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPEN_GATES = [
  'canonical_typed_environmental_effect_profile_required',
  'canonical_motion_budget_binding_required',
  'canonical_pixi_environmental_operation_extension_required',
  'canonical_transparent_time_sampled_artifact_contract_required',
  'canonical_work_graph_and_cost_binding_required',
  'canonical_remotion_time_sampled_overlay_adapter_required',
  'canonical_procedural_alpha_qa_required',
  'canonical_private_review_required',
] as const

export type LivingFrameEnvironmentalParticleOpenGate =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPEN_GATES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_ISSUE_CODES = [
  'input_invalid',
  'selected_component_invalid',
  'source_lineage_mismatch',
  'scene_or_component_mismatch',
  'environmental_activation_missing',
  'particle_capability_missing',
  'procedural_geometry_missing',
  'timing_binding_missing',
  'selective_motion_reconciliation_invalid',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameEnvironmentalParticleIssueCode =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_ISSUE_CODES)[number]

export interface LivingFrameEnvironmentalParticleAuthority {
  readonly readOnlyAdmissionCandidateAuthority: true
  readonly selectedSceneAuthority: false
  readonly environmentalProfileSelectionAuthority: false
  readonly motionPlanningAuthority: false
  readonly motionBudgetAuthority: false
  readonly timingAuthority: false
  readonly geometryAuthority: false
  readonly operationRegistryAuthority: false
  readonly toolRegistryAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly privateReviewAuthority: false
  readonly qaApprovalAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameEnvironmentalParticleAdmissionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_CLASS
  readonly admissionState:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_STATE
  readonly admissionCandidateId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly livingFrameComponentDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly componentGeometryBundleDigestSha256: string
    readonly selectiveMotionReconciliationDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
  }
  readonly selectedEnvironmentalIntent: {
    readonly componentRole: 'environmental_effect' | 'atmosphere'
    readonly focalRole: LivingFrameFocalRole
    readonly depthBand: LivingFrameDepthBand
    readonly environmentalMotionActivationId: string
    readonly deterministicParticleCapabilityConfirmed: true
    readonly linkedSemanticTimingRequestIds: readonly string[]
    readonly linkedSemanticPhases: readonly LivingFrameTimingPhase[]
    readonly motionBudgetRole: 'ambient'
    readonly oneEnvironmentalMotionGroupMaximum: true
    readonly boundedParticleCountRequired: true
    readonly stillnessOutsideBoundFrameRangeRequired: true
  }
  readonly exactFrameAndGeometryBinding: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly rect: LivingFrameNormalizedRect
    readonly pivot: LivingFrameNormalizedPoint
    readonly anchorPoint: LivingFrameNormalizedPoint
  }
  readonly requiredPrimitiveContract: {
    readonly motionProperty: 'particle_emission_normalized'
    readonly sceneArtifactKind: 'procedural_alpha_primitive'
    readonly rendererLayerPrimitive: 'procedural_alpha_layer'
    readonly alphaExpectation:
      'time_sampled_transparent_rgba_or_equivalent_deterministic_primitive'
    readonly exactConfirmedFrameRequired: true
    readonly frameAccurateMasterTimingRequired: true
    readonly deterministicServerSeedDigestSha256: string
    readonly callerSeedForbidden: true
    readonly callerParticleSettingsForbidden: true
    readonly callerDimensionsForbidden: true
    readonly callerPromptPathsUrlsBytesCredentialsCommandsOrEnvironmentForbidden:
      true
  }
  readonly typedEffectProfileBinding: {
    readonly status:
      'missing_from_current_selected_scene_component_contract'
    readonly componentSummaryParsingForbidden: true
    readonly componentIdParsingForbidden: true
    readonly subjectOrGenreInferenceForbidden: true
    readonly immutableApprovedProfileRefRequired: true
    readonly exactPhysicsAndAppearanceValuesRemainCanonicalOwnerDecision: true
  }
  readonly toolOperationDisposition: {
    readonly existingToolId:
      typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_TOOL_ID
    readonly existingOperationId:
      typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CURRENT_OPERATION_ID
    readonly candidateOperationId:
      typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CANDIDATE_OPERATION_ID
    readonly separateToolIdentityRequired: false
    readonly currentOperationOutput:
      'one_opaque_640x360_motion_card_png'
    readonly requiredOutput:
      'private_time_sampled_transparent_particle_primitive'
    readonly oneApprovedPrimitiveWorkItemPerAttemptRequired: true
    readonly remotionRemainsFinalCanvas: true
    readonly mismatchCodes:
      readonly LivingFrameEnvironmentalParticleMismatchCode[]
  }
  readonly currentSharedInterfaceConflictObserved: true
  readonly materializationAllowed: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly remotionAdapterMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly openGateCodes:
    readonly LivingFrameEnvironmentalParticleOpenGate[]
  readonly authorityBoundary:
    LivingFrameEnvironmentalParticleAuthority
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticleAdmission
  extends LivingFrameEnvironmentalParticleAdmissionDraft {
  readonly admissionDigestSha256: string
}

export interface LivingFrameEnvironmentalParticleAdmissionIssue {
  readonly code: LivingFrameEnvironmentalParticleIssueCode
  readonly path: string
}
