export const LIVING_FRAME_CONTRACT_VERSION = 'living-frame-professional-skill-component-v1' as const
export const LIVING_FRAME_CONTRACT_SOURCE = 'living_frame_contract_planning_only' as const
export const LIVING_FRAME_RUNTIME_READINESS = 'type_contract_only' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTRACT_STATUSES = [
  'planning_only',
  'deferred',
  'rejected',
  'blocked',
] as const
export type LivingFrameContractStatus = ValueOf<typeof LIVING_FRAME_CONTRACT_STATUSES>

export const LIVING_FRAME_EVIDENCE_CLASSES = [
  'mock_planning_evidence',
  'controlled_unverified_evidence',
  'future_worker_evidence_required',
] as const
export type LivingFrameEvidenceClass = ValueOf<typeof LIVING_FRAME_EVIDENCE_CLASSES>

export const LIVING_FRAME_MODES = [
  'living_a_roll',
  'living_still',
  'living_archive',
  'living_diagram',
  'hybrid_expansion',
] as const
export type LivingFrameMode = ValueOf<typeof LIVING_FRAME_MODES>

export const LIVING_FRAME_DECISIONS = [
  'selected',
  'rejected',
  'non_use',
  'deferred',
  'blocked',
] as const
export type LivingFrameDecision = ValueOf<typeof LIVING_FRAME_DECISIONS>

export const LIVING_FRAME_SCENE_DECISIONS = [
  'use_full',
  'use_subtle',
  'use_simpler_treatment',
  'defer',
  'block',
] as const
export type LivingFrameSceneDecision = ValueOf<typeof LIVING_FRAME_SCENE_DECISIONS>

export const LIVING_FRAME_REASON_CODES = [
  'explanation_benefits_from_in_frame_visualization',
  'selective_motion_improves_comprehension',
  'archive_material_benefits_from_spatial_organization',
  'exact_diagram_is_clearer_than_b_roll',
  'hybrid_takeover_improves_detail',
  'emotional_face_priority',
  'motion_would_distract',
  'insufficient_safe_space',
  'source_truth_uncertain',
  'timing_expectation_not_current',
  'output_frame_expectation_not_confirmed',
  'capability_qualification_required',
  'user_requested_minimal_visuals',
  'user_rejected_animation',
  'simpler_treatment_preferred',
] as const
export type LivingFrameReasonCode = ValueOf<typeof LIVING_FRAME_REASON_CODES>

export const LIVING_FRAME_SOURCE_TRUTH_MODES = [
  'canonical_illustrative_interpretation',
  'controlled_source_expectation',
  'exact_geography_verification_required',
  'exact_data_verification_required',
  'documentary_source_verification_required',
  'fictional_or_stylized',
  'unknown_blocked',
] as const
export type LivingFrameSourceTruthMode = ValueOf<typeof LIVING_FRAME_SOURCE_TRUTH_MODES>

export const LIVING_FRAME_NARRATIVE_PURPOSE_CODES = [
  'introduce_character',
  'demonstrate_decisive_action',
  'explain_mechanical_operation',
  'establish_geography',
  'explain_relationship',
  'show_cause_and_effect',
  'organize_archive_evidence',
  'protect_emotional_delivery',
] as const
export type LivingFrameNarrativePurposeCode = ValueOf<typeof LIVING_FRAME_NARRATIVE_PURPOSE_CODES>

export const LIVING_FRAME_VISUAL_VERBS = [
  'reveal',
  'converge',
  'restrict',
  'surround',
  'expand',
  'contract',
  'connect',
  'separate',
  'rotate',
  'approach',
  'retreat',
  'transform',
  'hold',
] as const
export type LivingFrameVisualVerb = ValueOf<typeof LIVING_FRAME_VISUAL_VERBS>

export const LIVING_FRAME_IMPORTANCE_LEVELS = ['support', 'important', 'hero'] as const
export type LivingFrameImportance = ValueOf<typeof LIVING_FRAME_IMPORTANCE_LEVELS>

export const LIVING_FRAME_MINI_SKILL_KEYS = [
  'narrative_illustration',
  'animation_aware_illustration',
  'component_decomposition',
  'component_rigging',
  'mechanical_part_motion',
  'environmental_motion',
  'editorial_motion',
  'path_motion',
  'deformation_motion',
  'state_change_motion',
  'focus_handoff',
  'attention_restoration',
  'visual_orbit',
  'camera_choreography',
  'semantic_scale',
  'sound_choreography',
  'visual_continuity_direction',
  'alpha_edge_qa',
  'living_frame_restraint_qa',
] as const
export type LivingFrameMiniSkillKey = ValueOf<typeof LIVING_FRAME_MINI_SKILL_KEYS>

export const LIVING_FRAME_CAPABILITY_KEYS = [
  'deterministic_vector_drawing',
  'exact_map_rendering',
  'exact_data_graphics',
  'still_image_generation_or_edit',
  'foreground_component_extraction',
  'temporal_subject_masking',
  'alpha_edge_refinement',
  'reference_conditioned_illustration',
  'structure_conditioned_illustration',
  'identity_conditioned_illustration',
  'low_rank_adapter_training_or_loading',
  'deterministic_particle_effects',
  'deterministic_scene_composition',
  'image_upscale_or_prepare',
  'visual_semantic_qa',
  'bounded_video_asset_generation',
] as const
export type LivingFrameCapabilityKey = ValueOf<typeof LIVING_FRAME_CAPABILITY_KEYS>

export const LIVING_FRAME_COMPONENT_ROLES = [
  'source_a_roll',
  'source_still',
  'opaque_background_plate',
  'reconstructed_background_plate',
  'primary_subject',
  'mechanical_component',
  'environmental_effect',
  'editorial_graphic',
  'exact_map_component',
  'exact_data_component',
  'foreground_occluder',
  'contact_shadow',
  'atmosphere',
] as const
export type LivingFrameComponentRole = ValueOf<typeof LIVING_FRAME_COMPONENT_ROLES>

export const LIVING_FRAME_FOCAL_ROLES = [
  'primary',
  'secondary',
  'ambient',
  'static_anchor',
  'none',
] as const
export type LivingFrameFocalRole = ValueOf<typeof LIVING_FRAME_FOCAL_ROLES>

export const LIVING_FRAME_TRANSPARENCY_EXPECTATIONS = [
  'opaque_plate',
  'native_alpha_preferred',
  'still_alpha_required',
  'temporal_mask_required',
  'procedural_alpha',
  'additive_effect',
] as const
export type LivingFrameTransparencyExpectation =
  ValueOf<typeof LIVING_FRAME_TRANSPARENCY_EXPECTATIONS>

export const LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS = [
  'opaque_plate',
  'native_alpha_claim_requires_qa',
  'postprocessed_still_mask_requires_qa',
  'temporal_mask_sequence_requires_qa',
  'procedural_alpha_requires_qa',
  'additive_blend_requires_qa',
] as const
export type LivingFrameAlphaSourceExpectation =
  ValueOf<typeof LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS>

export const LIVING_FRAME_ALPHA_QA_EXPECTATIONS = [
  'not_applicable',
  'future_alpha_qa_required',
  'procedural_alpha_validation_required',
  'temporal_mask_qa_required',
] as const
export type LivingFrameAlphaQaExpectation = ValueOf<typeof LIVING_FRAME_ALPHA_QA_EXPECTATIONS>

export const LIVING_FRAME_DEPTH_BANDS = [
  'far_background',
  'background',
  'behind_subject',
  'subject_plane',
  'in_front_of_subject',
  'foreground',
] as const
export type LivingFrameDepthBand = ValueOf<typeof LIVING_FRAME_DEPTH_BANDS>

export const LIVING_FRAME_PROVENANCE_EXPECTATIONS = [
  'approved_source_asset_expectation',
  'generated_illustration_expectation',
  'deterministic_draw_expectation',
  'exact_map_data_expectation',
  'source_a_roll_expectation',
  'controlled_fixture_only',
] as const
export type LivingFrameProvenanceExpectation =
  ValueOf<typeof LIVING_FRAME_PROVENANCE_EXPECTATIONS>

export const LIVING_FRAME_DEPENDENCY_KINDS = [
  'depends_on',
  'anchored_to',
  'occluded_by',
] as const
export type LivingFrameDependencyKind = ValueOf<typeof LIVING_FRAME_DEPENDENCY_KINDS>

export const LIVING_FRAME_ACTIVATION_ROLES = [
  'required',
  'supporting',
  'optional',
  'fallback',
  'qa',
] as const
export type LivingFrameActivationRole = ValueOf<typeof LIVING_FRAME_ACTIVATION_ROLES>

export const LIVING_FRAME_ACTIVATION_DECISIONS = [
  'use_full',
  'use_subtle',
  'use_optional',
  'delay',
  'replace_with_simpler_skill',
  'do_not_use',
] as const
export type LivingFrameActivationDecision =
  ValueOf<typeof LIVING_FRAME_ACTIVATION_DECISIONS>

export const LIVING_FRAME_INTENSITIES = ['subtle', 'standard', 'hero'] as const
export type LivingFrameIntensity = ValueOf<typeof LIVING_FRAME_INTENSITIES>

export const LIVING_FRAME_ATTENTION_EVENT_TYPES = [
  'prepare',
  'handoff',
  'hold',
  'restore',
  'transition_away',
] as const
export type LivingFrameAttentionEventType = ValueOf<typeof LIVING_FRAME_ATTENTION_EVENT_TYPES>

export const LIVING_FRAME_ATTENTION_TARGETS = [
  'speaker',
  'visual',
  'shared',
  'environment',
] as const
export type LivingFrameAttentionTarget = ValueOf<typeof LIVING_FRAME_ATTENTION_TARGETS>

export const LIVING_FRAME_ATTENTION_METHODS = [
  'focus_depth_expectation',
  'local_contrast_expectation',
  'camera_reframe_expectation',
  'camera_push_expectation',
  'motion_emphasis_expectation',
  'light_emphasis_expectation',
  'sound_emphasis_expectation',
] as const
export type LivingFrameAttentionMethod = ValueOf<typeof LIVING_FRAME_ATTENTION_METHODS>

export const LIVING_FRAME_TIMING_PHASES = [
  'prepare',
  'activate',
  'demonstrate',
  'resolve',
  'settle',
] as const
export type LivingFrameTimingPhase = ValueOf<typeof LIVING_FRAME_TIMING_PHASES>

export const LIVING_FRAME_SEMANTIC_CUE_CODES = [
  'spoken_meaning_begins',
  'visual_introduction_requested',
  'primary_motion_requested',
  'meaning_comprehension_hold_requested',
  'visual_resolution_requested',
  'attention_return_requested',
] as const
export type LivingFrameSemanticCueCode = ValueOf<typeof LIVING_FRAME_SEMANTIC_CUE_CODES>

export const LIVING_FRAME_SOUND_PURPOSES = [
  'mechanical_presence',
  'environmental_presence',
  'movement_support',
  'editorial_reveal',
  'scale_emphasis',
  'attention_handoff',
] as const
export type LivingFrameSoundPurpose = ValueOf<typeof LIVING_FRAME_SOUND_PURPOSES>

export const LIVING_FRAME_SOUND_PRIORITIES = [
  'ambient',
  'supporting',
  'primary_visual',
] as const
export type LivingFrameSoundPriority = ValueOf<typeof LIVING_FRAME_SOUND_PRIORITIES>

export const LIVING_FRAME_NARRATION_PROTECTION = ['strict', 'normal'] as const
export type LivingFrameNarrationProtection =
  ValueOf<typeof LIVING_FRAME_NARRATION_PROTECTION>

export const LIVING_FRAME_DUCKING_EXPECTATIONS = [
  'downstream_soundsync_required',
  'no_ducking_requested',
] as const
export type LivingFrameDuckingExpectation = ValueOf<typeof LIVING_FRAME_DUCKING_EXPECTATIONS>

export const LIVING_FRAME_SEMANTIC_SCALE_MODES = [
  'literal_physical',
  'data_proportional',
  'perspective',
  'editorial_symbolic',
] as const
export type LivingFrameSemanticScaleMode = ValueOf<typeof LIVING_FRAME_SEMANTIC_SCALE_MODES>

export const LIVING_FRAME_SEMANTIC_SCALE_MEANINGS = [
  'importance',
  'power',
  'threat',
  'quantity',
  'distance',
  'growth',
  'decline',
  'vulnerability',
  'centrality',
] as const
export type LivingFrameSemanticScaleMeaning =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_SCALE_MEANINGS>

export const LIVING_FRAME_FACTUAL_SCALE_GUARDS = [
  'literal_relationship_must_be_preserved',
  'data_proportions_must_be_preserved',
  'perspective_only',
  'symbolic_treatment_must_be_disclosed',
] as const
export type LivingFrameFactualScaleGuard = ValueOf<typeof LIVING_FRAME_FACTUAL_SCALE_GUARDS>

export const LIVING_FRAME_REGION_SAFETY_EXPECTATIONS = [
  'requires_downstream_verification',
  'blocked_collision',
] as const
export type LivingFrameRegionSafetyStatus =
  ValueOf<typeof LIVING_FRAME_REGION_SAFETY_EXPECTATIONS>

export const LIVING_FRAME_FALLBACK_STEPS = [
  'full_living_frame',
  'simplified_depth_composition',
  'safe_space_overlay',
  'lower_visual_stage',
  'side_by_side',
  'full_illustrated_scene',
  'static_card',
  'captions_only',
  'no_extra_visual',
] as const
export type LivingFrameFallbackStep = ValueOf<typeof LIVING_FRAME_FALLBACK_STEPS>

export const LIVING_FRAME_QA_CODES = [
  'narrative_relevance_expected',
  'one_focal_primary_expected',
  'visual_density_restraint_expected',
  'caption_safe_region_expected',
  'face_safe_region_expected',
  'gesture_safe_region_expected',
  'continuity_comparison_required',
  'component_separability_required',
  'alpha_multi_background_qa_required',
  'temporal_mask_stability_required',
  'pivot_physics_qa_required',
  'semantic_timing_binding_required',
  'attention_restoration_required',
  'semantic_scale_truth_required',
  'narration_protection_required',
  'documentary_integrity_required',
  'exact_geography_verification_required',
  'exact_data_verification_required',
  'generated_video_restraint_required',
] as const
export type LivingFrameQaCode = ValueOf<typeof LIVING_FRAME_QA_CODES>

export const LIVING_FRAME_CLOSED_GATE_CODES = [
  'canonical_planner_integration_required',
  'canonical_timing_revalidation_required',
  'canonical_estimate_required',
  'canonical_approval_required',
  'approved_snapshot_required',
  'controlled_illustration_qualification_required',
  'provider_route_review_required',
  'worker_schema_admission_required',
  'artifact_qa_required',
  'private_remotion_review_required',
  'identity_safety_review_required',
  'documentary_fact_verification_required',
  'temporal_mask_benchmark_required',
] as const
export type LivingFrameClosedGateCode = ValueOf<typeof LIVING_FRAME_CLOSED_GATE_CODES>

export const LIVING_FRAME_CONTINUITY_KINDS = [
  'style_bible',
  'character_identity_sheet',
  'object_identity_sheet',
  'environment_identity_sheet',
  'scene_design_sheet',
  'motion_language_sheet',
  'sound_language_sheet',
  'alpha_edge_rules',
  'continuity_ledger',
] as const
export type LivingFrameContinuityKind = ValueOf<typeof LIVING_FRAME_CONTINUITY_KINDS>

export const LIVING_FRAME_CAPABILITY_REQUIREMENT_ROLES = [
  'required',
  'supporting',
  'fallback',
] as const
export type LivingFrameCapabilityRequirementRole =
  ValueOf<typeof LIVING_FRAME_CAPABILITY_REQUIREMENT_ROLES>

export const LIVING_FRAME_COMPLEXITY_LEVELS = ['none', 'low', 'medium', 'high'] as const
export type LivingFrameComplexityLevel = ValueOf<typeof LIVING_FRAME_COMPLEXITY_LEVELS>

export const LIVING_FRAME_GENERATED_VIDEO_EXPECTATIONS = [
  'not_required',
  'future_capability_review_required',
] as const
export type LivingFrameGeneratedVideoExpectation =
  ValueOf<typeof LIVING_FRAME_GENERATED_VIDEO_EXPECTATIONS>

export const LIVING_FRAME_VALIDATION_ISSUE_CODES = [
  'non_json_input',
  'forbidden_key',
  'unsafe_text',
  'schema_rejected',
  'digest_mismatch',
  'crypto_unavailable',
  'duplicate_id',
  'duplicate_order',
  'dangling_reference',
  'cyclic_dependency',
  'focal_primary_rule',
  'non_use_carries_work',
  'frame_expectation_invalid',
  'timing_expectation_invalid',
  'semantic_order_invalid',
  'fallback_order_invalid',
  'handoff_restore_missing',
  'collision_unresolved',
  'identity_safety_gate_missing',
  'factual_distortion',
  'alpha_expectation_invalid',
  'capability_policy_invalid',
  'count_mismatch',
  'required_gate_missing',
  'authority_boundary_invalid',
  'continuity_expectation_invalid',
  'conflict_invalid',
  'digest_calculation_failed',
] as const
export type LivingFrameValidationIssueCode =
  ValueOf<typeof LIVING_FRAME_VALIDATION_ISSUE_CODES>

export interface LivingFrameAuthorityBoundary {
  readonly planningOnly: true
  readonly executable: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly runtimeAuthority: false
  readonly queueAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly costAuthority: false
}

export interface LivingFrameExpectationRef {
  readonly expectationRefId: string
  readonly expectedDigestSha256: string
  readonly evidenceClass: LivingFrameEvidenceClass
}

export interface LivingFrameOutputFrameExpectation extends LivingFrameExpectationRef {
  readonly confirmationStatus: 'expected_confirmed'
  readonly expectedWidth: number
  readonly expectedHeight: number
  readonly expectedAspectRatioNumerator: number
  readonly expectedAspectRatioDenominator: number
  readonly liveAuthorityVerified: false
}

export interface LivingFrameMasterTimingExpectation extends LivingFrameExpectationRef {
  readonly bindingStatus: 'expected_current'
  readonly exactFrameAuthorityProvided: false
  readonly liveAuthorityVerified: false
}

export interface LivingFrameSegmentExpectation {
  readonly segmentExpectationId: string
  readonly order: number
  readonly sourceSegmentRef: LivingFrameExpectationRef
  readonly outputFrameExpectationRefId: string
  readonly masterTimingExpectationRefId: string
}

export interface LivingFrameInputBindings {
  readonly compiledIntent: LivingFrameExpectationRef
  readonly sourceSequence: LivingFrameExpectationRef
  readonly videoUnderstanding: LivingFrameExpectationRef
  readonly adaptiveStrategy: LivingFrameExpectationRef
  readonly outputFrame: LivingFrameOutputFrameExpectation
  readonly masterTiming: LivingFrameMasterTimingExpectation
  readonly safeZoneRefs: readonly LivingFrameExpectationRef[]
  readonly faceProtectionRefs: readonly LivingFrameExpectationRef[]
  readonly gestureProtectionRefs: readonly LivingFrameExpectationRef[]
  readonly factSafetyRefs: readonly LivingFrameExpectationRef[]
  readonly characterSafetyRefs: readonly LivingFrameExpectationRef[]
  readonly segmentExpectations: readonly LivingFrameSegmentExpectation[]
}

export interface LivingFrameContinuityPackRef {
  readonly continuityRefId: string
  readonly kind: LivingFrameContinuityKind
  readonly version: number
  readonly expectedDigestSha256: string
  readonly evidenceClass: LivingFrameEvidenceClass
  readonly liveAuthorityVerified: false
}

export interface LivingFrameRejectedConcept {
  readonly conceptId: string
  readonly reasonCode: LivingFrameReasonCode
  readonly reasonSummary: string
}

export interface LivingFrameDecisionSummary {
  readonly decision: LivingFrameDecision
  readonly reasonCode: LivingFrameReasonCode
  readonly summary: string
  readonly selectedMode: LivingFrameMode | null
  readonly rejectedConcepts: readonly LivingFrameRejectedConcept[]
}

export interface LivingFrameComponentDependency {
  readonly componentId: string
  readonly dependsOnComponentId: string
  readonly kind: LivingFrameDependencyKind
}

export interface LivingFrameComponentPlan {
  readonly componentId: string
  readonly order: number
  readonly role: LivingFrameComponentRole
  readonly focalRole: LivingFrameFocalRole
  readonly summary: string
  readonly parentComponentId: string | null
  readonly anchorComponentId: string | null
  readonly depthBand: LivingFrameDepthBand
  readonly transparencyExpectation: LivingFrameTransparencyExpectation
  readonly alphaSourceExpectation: LivingFrameAlphaSourceExpectation
  readonly alphaQaExpectation: LivingFrameAlphaQaExpectation
  readonly rectangularBackgroundRejectionRequired: boolean
  readonly provenanceExpectation: LivingFrameProvenanceExpectation
  readonly evidenceClass: LivingFrameEvidenceClass
  readonly capabilityKeys: readonly LivingFrameCapabilityKey[]
  readonly continuityRefIds: readonly string[]
  readonly qaExpectationCodes: readonly LivingFrameQaCode[]
}

export interface LivingFrameSkillActivation {
  readonly activationId: string
  readonly order: number
  readonly miniSkillKey: LivingFrameMiniSkillKey
  readonly role: LivingFrameActivationRole
  readonly decision: LivingFrameActivationDecision
  readonly intensity: LivingFrameIntensity
  readonly reasonCode: LivingFrameReasonCode
  readonly reasonSummary: string
  readonly linkedComponentIds: readonly string[]
  readonly linkedTimingRequestIds: readonly string[]
  readonly dependsOnActivationIds: readonly string[]
  readonly conflictsWithActivationIds: readonly string[]
  readonly qaExpectationCodes: readonly LivingFrameQaCode[]
}

export interface LivingFrameSemanticTimingRequest {
  readonly timingRequestId: string
  readonly order: number
  readonly phase: LivingFrameTimingPhase
  readonly cueCode: LivingFrameSemanticCueCode
  readonly summary: string
  readonly exactFramesProvided: false
}

export interface LivingFrameAttentionEvent {
  readonly attentionEventId: string
  readonly order: number
  readonly eventType: LivingFrameAttentionEventType
  readonly target: LivingFrameAttentionTarget
  readonly methods: readonly LivingFrameAttentionMethod[]
  readonly summary: string
  readonly exactFramesProvided: false
}

export interface LivingFrameSemanticScaleRequest {
  readonly semanticScaleRequestId: string
  readonly componentId: string
  readonly mode: LivingFrameSemanticScaleMode
  readonly meaning: LivingFrameSemanticScaleMeaning
  readonly factualGuard: LivingFrameFactualScaleGuard
  readonly summary: string
}

export interface LivingFrameSoundRequest {
  readonly soundRequestId: string
  readonly order: number
  readonly linkedComponentId: string | null
  readonly purpose: LivingFrameSoundPurpose
  readonly priority: LivingFrameSoundPriority
  readonly narrationProtection: LivingFrameNarrationProtection
  readonly duckingExpectation: LivingFrameDuckingExpectation
  readonly summary: string
  readonly exactCuePlacementProvided: false
  readonly exactMixProvided: false
}

export interface LivingFrameRegionSafetyExpectation {
  readonly captions: LivingFrameRegionSafetyStatus
  readonly face: LivingFrameRegionSafetyStatus
  readonly gestures: LivingFrameRegionSafetyStatus
}

export interface LivingFrameScenePlan {
  readonly sceneId: string
  readonly order: number
  readonly segmentExpectationId: string
  readonly mode: LivingFrameMode
  readonly decision: LivingFrameSceneDecision
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly narrativePurposeCode: LivingFrameNarrativePurposeCode
  readonly visualVerb: LivingFrameVisualVerb
  readonly importance: LivingFrameImportance
  readonly summary: string
  readonly focalPrimaryComponentId: string
  readonly components: readonly LivingFrameComponentPlan[]
  readonly componentDependencies: readonly LivingFrameComponentDependency[]
  readonly skillActivations: readonly LivingFrameSkillActivation[]
  readonly semanticTimingRequests: readonly LivingFrameSemanticTimingRequest[]
  readonly attentionSequence: readonly LivingFrameAttentionEvent[]
  readonly semanticScaleRequests: readonly LivingFrameSemanticScaleRequest[]
  readonly soundRequests: readonly LivingFrameSoundRequest[]
  readonly regionSafety: LivingFrameRegionSafetyExpectation
  readonly fallbackLadder: readonly LivingFrameFallbackStep[]
  readonly continuityRefIds: readonly string[]
  readonly qaExpectationCodes: readonly LivingFrameQaCode[]
  readonly closedGateCodes: readonly LivingFrameClosedGateCode[]
}

export interface LivingFrameCapabilityRequirement {
  readonly capabilityKey: LivingFrameCapabilityKey
  readonly role: LivingFrameCapabilityRequirementRole
  readonly linkedSceneIds: readonly string[]
  readonly qualificationStatus: 'abstract_capability_expectation_only'
}

export interface LivingFrameEstimateInputs {
  readonly sceneCount: number
  readonly componentCount: number
  readonly generatedStillCount: number
  readonly deterministicDrawCount: number
  readonly stillAlphaCount: number
  readonly temporalMaskCount: number
  readonly semanticTimingRequestCount: number
  readonly soundRequestCount: number
  readonly qaExpectationCount: number
  readonly continuityReferenceCount: number
  readonly motionComplexity: LivingFrameComplexityLevel
  readonly cameraComplexity: LivingFrameComplexityLevel
  readonly controlledIllustrationComplexity: LivingFrameComplexityLevel
  readonly generatedVideoExpectation: LivingFrameGeneratedVideoExpectation
  readonly pricingAuthorityProvided: false
}

export interface LivingFrameProfessionalSkillComponentDraft {
  readonly contractVersion: typeof LIVING_FRAME_CONTRACT_VERSION
  readonly contractSource: typeof LIVING_FRAME_CONTRACT_SOURCE
  readonly status: LivingFrameContractStatus
  readonly runtimeReadiness: typeof LIVING_FRAME_RUNTIME_READINESS
  readonly authorityBoundary: LivingFrameAuthorityBoundary
  readonly inputBindings: LivingFrameInputBindings
  readonly decisionSummary: LivingFrameDecisionSummary
  readonly scenePlans: readonly LivingFrameScenePlan[]
  readonly continuityPackRefs: readonly LivingFrameContinuityPackRef[]
  readonly capabilityRequirements: readonly LivingFrameCapabilityRequirement[]
  readonly estimateInputs: LivingFrameEstimateInputs
  readonly qaExpectationCodes: readonly LivingFrameQaCode[]
  readonly closedGateCodes: readonly LivingFrameClosedGateCode[]
}

export interface LivingFrameProfessionalSkillComponent
  extends LivingFrameProfessionalSkillComponentDraft {
  readonly contractDigestSha256: string
}

export interface LivingFrameValidationIssue {
  readonly code: LivingFrameValidationIssueCode
  readonly path: string
}

export type LivingFrameValidationResult =
  | {
      readonly ok: true
      readonly component: LivingFrameProfessionalSkillComponent
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFrameValidationIssue[]
    }
