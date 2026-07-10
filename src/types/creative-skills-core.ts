import type { ApprovalStatus, CreditImpact, ID, ISODateString, JSONObject, ProcessingStatus } from './shared'

export type CreativeSkillFamily =
  | 'core_editing'
  | 'story_timing'
  | 'caption'
  | 'transition'
  | 'b_roll'
  | 'overlay_compositing'
  | 'graphic_design'
  | 'motion_design'
  | 'three_d_visuals'
  | 'stroke_motion'
  | 'real_motion'
  | 'browser_app_visuals'
  | 'audio_cleanup'
  | 'soundsync'
  | 'sfx'
  | 'color_finish'
  | 'render_export'
  | 'qa'
  | 'approval_credit'
  | 'reference_dna'
  | 'edit_preference'

export const CREATIVE_SKILL_KEYS = [
  'clean_cuts',
  'pacing_cleanup',
  'dead_space_removal',
  'filler_removal',
  'mistake_removal',
  'source_order_preservation',
  'recommended_structure_planning',
  'storytiming_coordination',
  'story_beat_mapping',
  'focus_density_budgeting',
  'skill_conflict_resolution',
  'no_captions',
  'caption_design',
  'caption_animation',
  'caption_line_breaking',
  'caption_keyword_emphasis',
  'caption_speaker_identification',
  'caption_accessibility_planning',
  'caption_translation_future_planning',
  'no_transition',
  'transition_design',
  'clean_cut_transition',
  'ambient_bridge_transition',
  'sound_bridge_transition',
  'graphic_transition',
  'object_transition',
  'three_d_transition_object',
  'no_b_roll',
  'b_roll_planning',
  'source_b_roll_selection',
  'b_roll_cutaway',
  'b_roll_proof_visual',
  'b_roll_context_visual',
  'b_roll_inset_layout',
  'generated_b_roll_future_planning',
  'three_d_object_broll',
  'no_overlay',
  'overlay_compositing',
  'safe_zone_layout',
  'face_safe_placement',
  'caption_collision_avoidance',
  'layer_order_planning',
  'edge_treatment_planning',
  'tracking_masking_future_planning',
  'no_graphic_design',
  'graphic_design_visual_explain',
  'lower_third_design',
  'feature_callout_design',
  'proof_card_design',
  'comparison_layout_design',
  'framework_diagram_design',
  'cta_card_design',
  'browser_annotation_design',
  'no_motion_design',
  'motion_design_overlay',
  'graphic_reveal_motion',
  'callout_motion',
  'diagram_build_motion',
  'kinetic_type_support',
  'beat_aware_motion',
  'hero_motion_moment',
  'no_3d',
  'three_d_overlay_integration',
  'three_d_screen_interaction',
  'three_d_explainer_visual',
  'three_d_symbolic_metaphor',
  'three_d_hero_reveal',
  'three_d_environment_extension',
  'three_d_data_visualization',
  'three_d_product_feature_breakout',
  'no_stroke_motion',
  'stroke_motion_story_layer',
  'stroke_motion_spoken_story_mode',
  'stroke_motion_source_reading_mode',
  'stroke_motion_meaning_expansion',
  'stroke_motion_connected_transition',
  'no_real_motion',
  'real_motion_overlay',
  'real_motion_object_integration',
  'real_motion_face_safe_placement',
  'real_motion_hero_moment',
  'no_browser_app_visual',
  'browser_app_visual_planning',
  'browser_frame_visual',
  'app_screen_visual',
  'dashboard_visual_planning',
  'browser_annotation_visual',
  'browser_redaction_planning',
  'source_status_planning',
  'voice_cleanup_planning',
  'room_tone_preservation',
  'noise_reduction_planning',
  'audio_leveling_planning',
  'ambience_preservation',
  'no_music',
  'soundsync_music_planning',
  'music_cue_planning',
  'music_ducking_planning',
  'beat_map_planning',
  'reference_music_dna_planning',
  'generated_music_future_planning',
  'no_sfx',
  'sfx_design',
  'transition_sfx_planning',
  'graphic_reveal_sfx',
  'motion_design_sfx',
  'three_d_object_sfx',
  'stroke_motion_sfx',
  'real_motion_sfx',
  'color_mood_planning',
  'color_consistency_planning',
  'premium_finish_planning',
  'platform_export_finish_planning',
  'render_manifest_planning',
  'aspect_ratio_adaptation_planning',
  'export_package_planning',
  'preview_render_planning',
  'professional_edit_qa',
  'skill_plan_qa',
  'storytiming_qa',
  'caption_readability_qa',
  'speech_clarity_qa',
  'visual_density_qa',
  'credit_approval_qa',
  'user_instruction_compliance_qa',
  'source_safety_qa',
  'credit_estimate_planning',
  'premium_skill_approval',
  'lower_cost_alternative_planning',
  'credit_reservation_gate_planning',
  'reference_dna_style_adaptation',
  'reference_dna_do_not_copy_rules',
  'reference_caption_style_guidance',
  'reference_transition_guidance',
  'reference_music_dna_guidance',
  'edit_preference_resolution',
  'edit_preference_snapshot',
  'preference_conflict_resolution',
  'preferred_skill_scoring',
  'blocked_skill_filtering',
] as const

export type CreativeSkillKey = typeof CREATIVE_SKILL_KEYS[number]

export type CreativeSkillType =
  | 'atomic_skill'
  | 'composite_skill'
  | 'restraint_skill'
  | 'support_skill'
  | 'qa_skill'
  | 'planning_skill'
  | 'future_runtime_candidate'

export type CreativeSkillLifecycleStatus =
  | 'draft'
  | 'proposed'
  | 'active'
  | 'future_pending'
  | 'deprecated'
  | 'superseded'
  | 'blocked'

export type CreativeSkillRouteStatus =
  | 'not_routed'
  | 'route_candidate'
  | 'route_preview'
  | 'planning_required'
  | 'storytiming_required'
  | 'approval_required'
  | 'qa_required'
  | 'blocked'
  | 'rejected'

export type CreativeSkillRecommendationLevel =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'optional_premium'
  | 'lower_cost_alternative'
  | 'not_recommended'
  | 'blocked'
  | 'user_requested'

export type CreativeSkillComplexity = 'simple' | 'moderate' | 'complex' | 'premium' | 'future_unknown'

export type CreativeSkillCreditTendency = CreditImpact | 'variable' | 'unknown'

export type CreativeSkillApprovalTendency =
  | 'not_required'
  | 'recommended'
  | 'required'
  | 'required_before_generation'
  | 'required_for_premium'
  | 'user_confirmation_required'
  | 'unknown'

export type CreativeSkillRelationshipType =
  | 'supports'
  | 'requires'
  | 'conflicts_with'
  | 'alternative_to'
  | 'lower_cost_alternative_to'
  | 'blocks'
  | 'blocked_by'
  | 'coordinates_with'
  | 'inherits_from'

export type CreativeSkillPlanningContractType =
  | 'universal_skill_plan'
  | 'transition_planning_contract'
  | 'overlay_compositing_planning_contract'
  | 'graphic_design_planning_contract'
  | 'motion_design_planning_contract'
  | 'three_d_visual_planning_contract'
  | 'b_roll_planning_contract'
  | 'caption_planning_contract'
  | 'sound_music_planning_contract'
  | 'storytiming_coordination_contract'
  | 'edit_preference_creative_direction_contract'
  | 'skill_taxonomy_and_family_catalog_contract'
  | 'visual_opportunity_engine_contract'
  | 'creative_concept_ideation_contract'
  | 'skill_candidate_scoring_and_resolver_contract'
  | 'skill_route_and_plan_assembly_contract'
  | 'skill_credit_and_approval_planning_contract'
  | 'skill_qa_and_validation_contract'
  | 'skill_diagnostics_and_static_validation_contract'

export type CreativeSkillRuntimeReadiness =
  | 'docs_only'
  | 'type_contract_only'
  | 'mock_fixture_future'
  | 'schema_future'
  | 'planner_future'
  | 'runtime_future'
  | 'blocked'

export type CreativeSkillSourceSafetyStatus =
  | 'not_applicable'
  | 'source_confirmed'
  | 'source_unconfirmed'
  | 'proof_required'
  | 'rights_unknown'
  | 'redaction_required'
  | 'unsafe'
  | 'blocked'

export interface CreativeSkillCatalogRecord {
  id: ID
  skillKey: CreativeSkillKey
  displayName: string
  skillFamily: CreativeSkillFamily
  skillType: CreativeSkillType
  shortPurpose: string
  primaryPlanningContract: CreativeSkillPlanningContractType
  lifecycleStatus: CreativeSkillLifecycleStatus
  routeStatus: CreativeSkillRouteStatus
  recommendationLevel: CreativeSkillRecommendationLevel
  complexity: CreativeSkillComplexity
  defaultCreditTendency: CreativeSkillCreditTendency
  defaultApprovalTendency: CreativeSkillApprovalTendency
  runtimeReadiness: CreativeSkillRuntimeReadiness
  sourceSafetyStatus: CreativeSkillSourceSafetyStatus
  whenToUseSummary: string
  whenToAvoidSummary: string
  relatedSkillKeys: CreativeSkillKey[]
  alternativeSkillKeys: CreativeSkillKey[]
  lowerCostAlternativeSkillKeys: CreativeSkillKey[]
  noActionCounterpartSkillKey?: CreativeSkillKey
  approvalStatusHint?: ApprovalStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeSkillFamilyRecord {
  id: ID
  skillFamily: CreativeSkillFamily
  displayName: string
  description: string
  canonicalSkillKeys: CreativeSkillKey[]
  parentFamily?: CreativeSkillFamily
  relatedFamilies: CreativeSkillFamily[]
  lifecycleStatus: CreativeSkillLifecycleStatus
  defaultPlanningContract: CreativeSkillPlanningContractType
  defaultCreditTendency: CreativeSkillCreditTendency
  defaultApprovalTendency: CreativeSkillApprovalTendency
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeSkillAliasRecord {
  id: ID
  alias: string
  canonicalSkillKey: CreativeSkillKey
  aliasType: 'display_name' | 'legacy_name' | 'user_phrase' | 'prompt_phrase' | 'source_doc_phrase'
  conflictStatus: 'clear' | 'possible_conflict' | 'conflict' | 'needs_review'
  reviewedBy?: ID
  reviewedAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeSkillRelationshipRecord {
  id: ID
  fromSkillKey: CreativeSkillKey
  toSkillKey: CreativeSkillKey
  relationshipType: CreativeSkillRelationshipType
  reason: string
  strength: 'weak' | 'moderate' | 'strong' | 'required'
  status: CreativeSkillLifecycleStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeSkillDuplicateReviewRecord {
  id: ID
  proposedSkillKey: CreativeSkillKey | string
  proposedSkillFamily: CreativeSkillFamily | string
  similarExistingSkillKeys: CreativeSkillKey[]
  duplicateRisk: 'none' | 'low' | 'medium' | 'high' | 'confirmed_duplicate'
  reviewDecision: 'accept_new' | 'merge_with_existing' | 'alias_existing' | 'reject' | 'needs_owner_review'
  rationale: string
  reviewerId?: ID
  reviewedAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeSkillContractMappingRecord {
  id: ID
  skillKey: CreativeSkillKey
  skillFamily: CreativeSkillFamily
  planningContractType: CreativeSkillPlanningContractType
  ownerDocPath: string
  checklistDocPath?: string
  contractStatus: ProcessingStatus
  runtimeReadiness: CreativeSkillRuntimeReadiness
  requiredBeforeRouteAssembly: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}
