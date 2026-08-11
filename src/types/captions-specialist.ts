export const CAPTIONS_SPECIALIST_SKILL_KEY = 'captions' as const
export const CAPTIONS_SPECIALIST_VERSION = 'captions-specialist-v1' as const
export const CAPTIONS_SPECIALIST_CONTRACT_VERSION =
  'captions-specialist-contract-v1' as const
export const CAPTIONS_SPECIALIST_SECURITY_POLICY_VERSION =
  'captions-specialist-private-security-policy-v1' as const

export const CAPTIONS_VIDEO_JOB_TYPES = [
  'plan_caption_strategy',
  'map_caption_opportunities',
  'classify_caption_integration',
  'plan_caption_style_language',
  'plan_caption_projections',
  'compile_caption_approval_envelope',
  'estimate_caption_work',
  'inspect_project_caption_continuity',
] as const

export const CAPTIONS_SCENE_JOB_TYPES = [
  'reserve_caption_space',
  'plan_caption_blocking_preview',
  'check_caption_finish_readiness',
  'resolve_late_bound_caption_scene',
  'resolve_semantic_caption_phrases',
  'resolve_multi_track_caption_scene',
  'resolve_spatial_typography',
  'resolve_subject_occluded_typography',
  'resolve_front_of_subject_typography',
  'resolve_object_anchored_typography',
  'resolve_environmental_typography',
  'resolve_hero_typography',
  'resolve_persistent_topic_typography',
  'compile_caption_scene_graph',
  'compile_caption_render_spec',
  'compile_accessible_caption_projection',
  'compile_reduced_motion_caption_projection',
  'repair_caption_scene',
  'recompose_caption_output',
  'inspect_caption_specific_result',
] as const

export const CAPTIONS_BOUNDARY_JOB_TYPES = [
  'plan_caption_to_visual_handoff',
  'provide_typographic_transition_support',
  'resolve_caption_mode_transition',
  'prepare_caption_boundary_timing_requirements',
  'inspect_caption_boundary_behavior',
] as const

export const CAPTIONS_SUPPORT_JOB_TYPES = [
  'provide_speech_derived_typography_spec',
  'provide_caption_phrase_lineage',
  'provide_caption_safe_region_constraints',
  'provide_caption_to_visual_handoff_spec',
  'provide_accessible_text_projection',
  'provide_typographic_transition_component',
  'provide_caption_broll_composition_constraints',
  'provide_caption_living_frame_handoff_constraints',
] as const

export type CaptionsSupportJobType = typeof CAPTIONS_SUPPORT_JOB_TYPES[number]

export const CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES:
Readonly<Record<CaptionsSupportJobType, string>> = Object.freeze({
  provide_speech_derived_typography_spec:
    'caption_speech_derived_typography_spec',
  provide_caption_phrase_lineage: 'caption_phrase_lineage',
  provide_caption_safe_region_constraints:
    'caption_safe_region_constraints',
  provide_caption_to_visual_handoff_spec:
    'caption_to_visual_handoff_spec',
  provide_accessible_text_projection:
    'caption_accessible_text_projection',
  provide_typographic_transition_component:
    'caption_typographic_transition_component',
  provide_caption_broll_composition_constraints:
    'caption_broll_composition_constraints',
  provide_caption_living_frame_handoff_constraints:
    'caption_living_frame_handoff_constraints',
})

export const CAPTIONS_SUPPORTED_JOB_TYPES = [
  ...CAPTIONS_VIDEO_JOB_TYPES,
  ...CAPTIONS_SCENE_JOB_TYPES,
  ...CAPTIONS_BOUNDARY_JOB_TYPES,
  ...CAPTIONS_SUPPORT_JOB_TYPES,
] as const

export type CaptionsSupportedJobType =
  typeof CAPTIONS_SUPPORTED_JOB_TYPES[number]

export const CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES = [
  'plan_caption_to_visual_handoff',
  'provide_typographic_transition_support',
  'provide_caption_to_visual_handoff_spec',
  'provide_caption_broll_composition_constraints',
  'provide_caption_living_frame_handoff_constraints',
] as const satisfies readonly CaptionsSupportedJobType[]

export type CaptionsCrossSystemOutputJobType =
  typeof CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES[number]

export const CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE =
  'plan_caption_to_visual_handoff' as const satisfies
  CaptionsCrossSystemOutputJobType

export const CAPTIONS_UNSUPPORTED_JOB_TYPES = [
  'create_global_edit_plan',
  'mutate_timeline',
  'expand_authorized_scope',
  'dispatch_peer_skill_directly',
  'own_picture_lock',
  'own_visual_intelligence',
  'generate_tracking_artifact',
  'directly_execute_sam3_1',
  'own_living_frame_visual',
  'own_complete_transition_boundary',
  'mix_final_audio',
  'own_final_canvas',
  'approve_final_qa',
  'reserve_or_settle_credits',
  'alter_billing',
  'perform_public_delivery',
  'deploy_production',
  'execute_model_authored_code',
] as const

export type CaptionsUnsupportedJobType =
  typeof CAPTIONS_UNSUPPORTED_JOB_TYPES[number]

export const CAPTIONS_ADVANCED_VISUAL_JOB_TYPES = [
  'plan_caption_blocking_preview',
  'resolve_multi_track_caption_scene',
  'resolve_spatial_typography',
  'resolve_subject_occluded_typography',
  'resolve_front_of_subject_typography',
  'resolve_object_anchored_typography',
  'resolve_environmental_typography',
  'resolve_hero_typography',
  'resolve_persistent_topic_typography',
  'repair_caption_scene',
  'recompose_caption_output',
  'inspect_caption_specific_result',
  'inspect_caption_boundary_behavior',
] as const

export const CAPTIONS_TRACKING_JOB_TYPES = [
  'resolve_subject_occluded_typography',
  'resolve_front_of_subject_typography',
  'resolve_object_anchored_typography',
  'resolve_environmental_typography',
] as const

export const CAPTIONS_LIVING_FRAME_JOB_TYPES = [
  'plan_caption_to_visual_handoff',
  'provide_caption_to_visual_handoff_spec',
  'provide_caption_living_frame_handoff_constraints',
] as const

export const CAPTIONS_CAP_01_ARTIFACT_TYPE =
  'caption_specialist_job_receipt' as const
