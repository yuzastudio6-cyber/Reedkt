import type { SupabaseSchemaPlan } from './supabase-schema-plan'
import type { MigrationDraftPlan } from './supabase-migration-drafts'
import type { MigrationReviewPlan } from './supabase-rls-hardening'
import type { SupabaseProductionReadinessPlan } from './supabase-production-readiness'
import type { AgentQAFallbackPlan, AsyncAssetReconciliationPlan, EditingAgentExecutionPlan } from './editing-agent-runtime'
import type { TestingReadinessReport } from './testing-readiness'

export type SignatureSystem =
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'sound_sync'
  | 'none'

export type EditLevel = 'basic' | 'pro' | 'premium'

export type EditingCategory =
  | 'storytelling'
  | 'lifestyle'
  | 'business_brand'
  | 'education_explainer'
  | 'documentary_case_study'

export type HookPolicy = 'required' | 'recommended' | 'optional' | 'not_needed' | 'avoid'

export type StructurePreference =
  | 'preserve_source_order'
  | 'improve_if_needed'
  | 'restructure_for_social'
  | 'let_ai_recommend'

export type VideoWorkflowType =
  | 'simple_clean_edit'
  | 'social_short_viral_clip'
  | 'talking_head_personal_brand'
  | 'podcast_clip'
  | 'vlog_lifestyle'
  | 'product_demo'
  | 'real_estate_property_tour'
  | 'education_explainer'
  | 'marketing_ad'
  | 'testimonial_case_study'
  | 'custom_let_ai_decide'

export type TargetPlatform =
  | 'tiktok_reels_shorts'
  | 'youtube'
  | 'website'
  | 'course_training'
  | 'client_review'
  | 'custom'

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | '4:3' | 'let_ai_decide'

export type FrameTemplateType =
  | 'vertical_talking_head_lower_panel'
  | 'vertical_full_panel'
  | 'youtube_side_panel'
  | 'youtube_lower_panel'
  | 'square_center_panel'
  | 'portrait_feed_lower_panel'
  | 'classic_documentary_center_panel'
  | 'let_ai_decide'

export type AspectRatioConfirmationStatus =
  | 'not_started'
  | 'recommended'
  | 'needs_confirmation'
  | 'confirmed'
  | 'changed_after_plan'

export type AspectRatioSource =
  | 'user_selected'
  | 'platform_recommended'
  | 'demo_scenario'
  | 'reference_video'
  | 'custom'
  | 'unknown'

export type SourceToOutputFitMode =
  | 'crop'
  | 'contain'
  | 'pad'
  | 'blur_background'
  | 'panel_background'
  | 'smart_reframe'
  | 'custom'

export interface AspectRatioOption {
  id: AspectRatio
  label: string
  description: string
  bestFor: TargetPlatform[]
  canvasWidth: number
  canvasHeight: number
  commonUses: string[]
  layoutNotes: string[]
}

export interface AspectRatioRecommendation {
  recommendedAspectRatio: AspectRatio
  targetPlatform: TargetPlatform
  reason: string
  confidence: 'low' | 'medium' | 'high'
  mustConfirm: boolean
}

export interface SourceToOutputFramePlan {
  id: string
  sourceAspectRatio?: AspectRatio | string
  targetAspectRatio: AspectRatio
  fitMode: SourceToOutputFitMode
  speakerSafe: boolean
  productSafe: boolean
  captionSafe: boolean
  notes: string[]
  qaChecks: string[]
}

export interface AspectRatioFramePlan {
  id: string
  status: AspectRatioConfirmationStatus
  source: AspectRatioSource
  targetPlatform: TargetPlatform
  selectedAspectRatio?: AspectRatio
  recommendedAspectRatio?: AspectRatioRecommendation
  confirmedAt?: string
  canvasWidth?: number
  canvasHeight?: number
  sourceToOutputFramePlan?: SourceToOutputFramePlan
  frameTemplateType?: FrameTemplateType
  safeMargin: number
  speakerZone?: RectZone
  visualZone?: RectZone
  captionSafeZone?: RectZone
  panelBackgroundColor: string
  mustConfirmBeforeApproval: boolean
  resetApprovalOnChange: boolean
  globalRules: string[]
  qaChecks: string[]
  notes: string[]
}

export type SpeakerPresenceMode =
  | 'full_speaker'
  | 'partial_speaker'
  | 'picture_in_picture'
  | 'side_panel_speaker'
  | 'voice_only'
  | 'hidden'

export type VisualDominanceMode =
  | 'none'
  | 'support'
  | 'balanced'
  | 'dominant'
  | 'full_takeover'

export type SpeakerVisualLayoutMode =
  | 'full_speaker'
  | 'voiceover_visual_takeover'
  | 'picture_in_picture_speaker'
  | 'side_by_side_speaker_visual'
  | 'vertical_speaker_top_visual_bottom'
  | 'vertical_visual_top_speaker_bottom'
  | 'lower_visual_panel'
  | 'full_graphic_explainer'
  | 'full_stroke_motion_scene'
  | 'full_map_takeover'
  | 'full_evidence_board'
  | 'screen_capture_with_speaker_pip'
  | 'speaker_cutout_overlay'
  | 'b_roll_cutaway'
  | 'split_screen_comparison'
  | 'before_after_panel'
  | 'object_anchored_callout'

export type LayoutRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'premium'

export type LayoutComplexity =
  | 'simple'
  | 'moderate'
  | 'advanced'
  | 'premium'

export type ForegroundObjectKind =
  | 'human_subject'
  | 'contact_object'
  | 'hero_object'
  | 'scene_anchor_object'
  | 'background_object'
  | 'unknown'

export type DepthCompositingMode =
  | 'none'
  | 'graphic_on_top'
  | 'graphic_behind_subject'
  | 'graphic_behind_subject_and_contact_objects'
  | 'graphic_between_background_and_foreground'
  | 'subject_cutout_overlay'
  | 'object_anchored_overlay'
  | 'masked_panel_behind_subject'
  | 'full_visual_replacement'

export type MaskStrategy =
  | 'none'
  | 'subject_mask'
  | 'subject_plus_contact_object_mask'
  | 'hero_object_mask'
  | 'scene_anchor_mask'
  | 'multi_object_depth_mask'
  | 'full_cutout_composition'

export type MaskRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'premium'

export type TrackingRequirement =
  | 'none'
  | 'static_mask'
  | 'light_tracking'
  | 'object_tracking'
  | 'multi_object_tracking'
  | 'manual_review_recommended'

export type VideoUnderstandingConfidence =
  | 'low'
  | 'medium'
  | 'high'

export type ClipAnalysisRole =
  | 'main_story'
  | 'hook_candidate'
  | 'context'
  | 'proof'
  | 'b_roll'
  | 'speaker'
  | 'product'
  | 'screen_recording'
  | 'location'
  | 'transition'
  | 'ending'
  | 'optional'
  | 'unknown'

export type VisualSupportOpportunityType =
  | 'caption_only'
  | 'b_roll_cutaway'
  | 'still_card'
  | 'fact_card'
  | 'name_card'
  | 'timeline_card'
  | 'evidence_board'
  | 'graphic_explainer'
  | 'chart_or_diagram'
  | 'map_animation'
  | 'screen_capture'
  | 'stroke_motion'
  | 'real_motion'
  | 'full_visual_takeover'
  | 'lower_panel_visual'
  | 'picture_in_picture'
  | 'no_extra_visual'

export type ToolStrategyHint =
  | 'remotion_layout'
  | 'gpt_image_asset'
  | 'wan_animation'
  | 'hailuo_fallback'
  | 'veo_premium_fallback_only'
  | 'map_tool'
  | 'chart_tool'
  | 'browser_capture_tool'
  | 'color_pipeline'
  | 'audio_pipeline'
  | 'qa_vision_tool'
  | 'none'

export type OpenSourceToolId =
  | 'remotion'
  | 'ffmpeg'
  | 'opencolorio'
  | 'openimageio'
  | 'opencv'
  | 'sharp'
  | 'maplibre'
  | 'turf'
  | 'd3'
  | 'echarts'
  | 'vega_lite'
  | 'playwright'
  | 'lottie'
  | 'three_js'
  | 'pixijs'
  | 'konva'
  | 'audioflux'
  | 'essentia'
  | 'librosa'
  | 'whisper_cpp'
  | 'deck_gl'
  | 'cesium_js'
  | 'vapoursynth'
  | 'signalsmith_stretch'
  | 'rubber_band'
  | 'custom'

export type ToolCategory =
  | 'renderer_compositor'
  | 'video_processing'
  | 'color_management'
  | 'image_processing'
  | 'visual_analysis'
  | 'maps_geospatial'
  | 'charts_dataviz'
  | 'browser_capture'
  | 'vector_animation'
  | 'three_d_visuals'
  | 'canvas_graphics'
  | 'audio_analysis'
  | 'transcription'
  | 'qa_regression'
  | 'experimental'

export type ToolExecutionMode =
  | 'inside_remotion'
  | 'worker_preprocess'
  | 'worker_postprocess'
  | 'qa_only'
  | 'future_worker'
  | 'planning_only'

export type ToolAdoptionStage =
  | 'launch_core'
  | 'planned'
  | 'future'
  | 'experimental'
  | 'needs_license_review'

export type ToolInputType =
  | 'source_video'
  | 'audio'
  | 'image'
  | 'generated_image'
  | 'ai_video_clip'
  | 'json_data'
  | 'geojson'
  | 'url'
  | 'html'
  | 'css'
  | 'transcript'
  | 'frame_layout'
  | 'renderer_layer'
  | 'none'

export type ToolOutputType =
  | 'processed_video'
  | 'processed_audio'
  | 'image_asset'
  | 'screenshot_asset'
  | 'map_visual'
  | 'chart_visual'
  | 'svg_visual'
  | 'json_spec'
  | 'renderer_layer'
  | 'qa_report'
  | 'timing_map'
  | 'none'

export type ToolSettingType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'color'
  | 'json'
  | 'coordinates'
  | 'rect'
  | 'file_reference'

export interface ToolSettingDefinition {
  id: string
  label: string
  type: ToolSettingType
  description: string
  required: boolean
  defaultValue?: unknown
  options?: string[]
  min?: number
  max?: number
  unit?: string
}

export interface ToolPreset {
  id: string
  label: string
  description: string
  toolIds: OpenSourceToolId[]
  category: ToolCategory
  settings: Record<string, unknown>
  bestUseCases: string[]
  avoidUseCases: string[]
  tierFit: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
}

export interface ToolProfile {
  id: OpenSourceToolId
  label: string
  category: ToolCategory
  adoptionStage: ToolAdoptionStage
  executionMode: ToolExecutionMode
  description: string
  bestFor: string[]
  avoidFor: string[]
  inputTypes: ToolInputType[]
  outputTypes: ToolOutputType[]
  settingDefinitions: ToolSettingDefinition[]
  defaultPresets: string[]
  tierAvailability: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  remotionIntegration: string
  qaChecks: string[]
  licenseNotes: string[]
  productionNotes: string[]
}

export interface ToolStrategyHintDetail {
  toolId: OpenSourceToolId
  reason: string
  expectedInputTypes: ToolInputType[]
  expectedOutputTypes: ToolOutputType[]
  suggestedPresetIds: string[]
  settings: Record<string, unknown>
  fallbackToolIds: OpenSourceToolId[]
  qaChecks: string[]
}

export interface ToolRegistrySummary {
  launchCoreToolCount: number
  plannedToolCount: number
  futureToolCount: number
  needsLicenseReviewCount: number
  categories: ToolCategory[]
  notes: string[]
}

export type ToolChainId =
  | 'remotion_layout_chain'
  | 'map_route_chain'
  | 'chart_diagram_chain'
  | 'browser_capture_chain'
  | 'color_pipeline_chain'
  | 'audio_pipeline_chain'
  | 'visual_qa_chain'
  | 'ai_animation_asset_chain'
  | 'premium_rescue_chain'
  | 'custom'

export type ToolStrategyStatus =
  | 'planned'
  | 'requires_approval'
  | 'approved'
  | 'blocked'
  | 'future_only'
  | 'needs_license_review'
  | 'not_available_in_tier'

export type ToolStrategyPurpose =
  | 'layout_composition'
  | 'caption_layout'
  | 'graphic_design'
  | 'map_animation'
  | 'chart_diagram'
  | 'browser_capture'
  | 'image_preparation'
  | 'color_processing'
  | 'audio_processing'
  | 'visual_qa'
  | 'depth_mask_planning'
  | 'ai_asset_generation_support'
  | 'render_postprocess'
  | 'custom'

export interface ToolSettingValue {
  settingId: string
  value: unknown
  source:
    | 'tool_default'
    | 'preset'
    | 'planner'
    | 'user_request'
    | 'adaptive_strategy'
    | 'qa_requirement'
    | 'custom'
  notes?: string
}

export interface ToolChainStep {
  id: string
  order: number
  toolId: OpenSourceToolId
  label: string
  executionMode: ToolExecutionMode
  purpose: ToolStrategyPurpose
  inputTypes: ToolInputType[]
  outputTypes: ToolOutputType[]
  presetIds: string[]
  settings: ToolSettingValue[]
  status: ToolStrategyStatus
  reason: string
  qaChecks: string[]
  workerNotes: string[]
}

export interface ToolStrategyPlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  renderStrategyItemId?: string
  adaptiveStrategyItemId?: string
  chainId: ToolChainId
  label: string
  purpose: ToolStrategyPurpose
  selectedToolIds: OpenSourceToolId[]
  primaryToolId: OpenSourceToolId
  fallbackToolIds: OpenSourceToolId[]
  steps: ToolChainStep[]
  expectedInputs: ToolInputType[]
  expectedOutputs: ToolOutputType[]
  settingsSummary: string
  reason: string
  whyNotAiVideo?: string
  whyNotRemotionOnly?: string
  tierAllowed: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  status: ToolStrategyStatus
  adoptionStage: ToolAdoptionStage
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  fallbackStrategy: string[]
  qaChecks: string[]
  licenseNotes: string[]
  userFacingSummary: string
  developerNotes: string[]
}

export interface ToolStrategyPlan {
  id: string
  summary: string
  items: ToolStrategyPlanItem[]
  toolIdsUsed: OpenSourceToolId[]
  chainIdsUsed: ToolChainId[]
  presetsUsed: string[]
  launchCoreToolsUsed: OpenSourceToolId[]
  futureToolsReferenced: OpenSourceToolId[]
  toolsNeedingLicenseReview: OpenSourceToolId[]
  aiGenerationAvoidedReasons: string[]
  globalRules: string[]
  qaChecks: string[]
  notes: string[]
}

export type RenderStrategyType =
  | 'remotion_only'
  | 'gpt_image_then_remotion'
  | 'open_source_tool_then_remotion'
  | 'ai_video_then_remotion'
  | 'hybrid_generation_then_remotion'
  | 'worker_preprocess_then_remotion'
  | 'remotion_then_worker_postprocess'
  | 'qa_tool_only'
  | 'none'

export type RemotionCapabilityId =
  | 'caption_layer'
  | 'lower_third'
  | 'title_card'
  | 'fact_card'
  | 'name_card'
  | 'list_card'
  | 'timeline_card'
  | 'evidence_board'
  | 'graphic_panel'
  | 'motion_design'
  | 'diagram_build'
  | 'arrow_flow'
  | 'number_countup'
  | 'still_image_motion'
  | 'split_screen'
  | 'picture_in_picture'
  | 'side_by_side_layout'
  | 'lower_visual_panel'
  | 'full_visual_takeover_layout'
  | 'map_layer_placement'
  | 'chart_layer_placement'
  | 'screen_capture_placement'
  | 'ai_video_panel_placement'
  | 'transition_layer'
  | 'background_panel'
  | 'safe_zone_layout'
  | 'depth_layer_composition'
  | 'custom'

export type RenderStrategyComplexity =
  | 'simple'
  | 'moderate'
  | 'advanced'
  | 'premium'

export interface RemotionCapability {
  id: RemotionCapabilityId
  label: string
  description: string
  bestFor: string[]
  avoidFor: string[]
  requiredInputs: ToolInputType[]
  outputType: ToolOutputType
  compatibleAssetTypes: VisualAssetType[]
  compatibleLayouts: SpeakerVisualLayoutMode[]
  defaultMotionPresets: string[]
  tierFit: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  qaChecks: string[]
}

export interface RenderStrategyPlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  layoutItemId?: string
  depthAwareOverlayItemId?: string
  strategyType: RenderStrategyType
  label: string
  purpose: string
  selectedRemotionCapabilities: RemotionCapabilityId[]
  selectedOpenSourceTools: OpenSourceToolId[]
  selectedProviderModels: ProviderModel[]
  requiredInputs: ToolInputType[]
  expectedOutputs: ToolOutputType[]
  complexity: RenderStrategyComplexity
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  tierAllowed: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  needsGptImage: boolean
  needsAiVideo: boolean
  needsOpenSourceTool: boolean
  needsWorkerPreprocess: boolean
  needsWorkerPostprocess: boolean
  remotionOwnsFinalComposition: boolean
  reason: string
  fallbackStrategyType?: RenderStrategyType
  fallbackReason?: string
  settings: Record<string, unknown>
  qaChecks: string[]
  workerNotes: string[]
  toolStrategyItemIds?: string[]
}

export interface RenderStrategyPlan {
  id: string
  summary: string
  items: RenderStrategyPlanItem[]
  remotionCapabilitiesUsed: RemotionCapabilityId[]
  openSourceToolsUsed: OpenSourceToolId[]
  providerModelsReferenced: ProviderModel[]
  strategyCounts: Record<RenderStrategyType, number>
  globalRules: string[]
  qaChecks: string[]
  notes: string[]
}

export type VisualQualityIssue =
  | 'low_light'
  | 'overexposed'
  | 'underexposed'
  | 'shaky'
  | 'blurry'
  | 'busy_background'
  | 'face_too_low'
  | 'face_too_high'
  | 'product_obscured'
  | 'caption_safe_zone_risk'
  | 'none'

export type AudioQualityIssue =
  | 'background_noise'
  | 'uneven_loudness'
  | 'too_quiet'
  | 'clipping'
  | 'echo'
  | 'music_over_voice'
  | 'long_silence'
  | 'many_fillers'
  | 'none'

export type AdaptiveDecisionKind =
  | 'keep_speaker_focus'
  | 'use_voiceover_visual'
  | 'use_b_roll'
  | 'use_still_card'
  | 'use_graphic_explainer'
  | 'use_map'
  | 'use_chart_or_diagram'
  | 'use_screen_capture'
  | 'use_stroke_motion'
  | 'use_real_motion'
  | 'use_depth_overlay'
  | 'use_captions_only'
  | 'use_no_extra_visual'
  | 'ask_clarifying_question'
  | 'simplify_for_tier'
  | 'custom'

export type CreativeIntensity =
  | 'minimal'
  | 'balanced'
  | 'expressive'
  | 'high_impact'
  | 'cinematic'
  | 'restrained'

export type GenerationRestraint =
  | 'avoid_generation'
  | 'use_generation_only_if_needed'
  | 'allow_generation'
  | 'prefer_generation'
  | 'premium_fallback_only'

export type StrategyPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type MoodStyle =
  | 'clean'
  | 'premium'
  | 'cinematic'
  | 'energetic'
  | 'emotional'
  | 'educational'
  | 'luxury'
  | 'funny_playful'
  | 'corporate'
  | 'viral_fast_paced'
  | 'let_ai_decide'

export type VisualPreference =
  | 'let_ai_decide'
  | 'keep_visuals_minimal'
  | 'balanced_visual_mix'
  | 'more_stroke_motion'
  | 'more_graphic_design'
  | 'real_motion_if_useful'
  | 'no_extra_visuals'

export type CreditPreference = 'low_credit_cost' | 'balanced' | 'premium_best_result' | 'let_ai_estimate'

export type SourceSequenceMode =
  | 'single_complete_video'
  | 'multi_clip_story_order'
  | 'unordered_clips_needs_ai_help'
  | 'b_roll_plus_main_clip'
  | 'mixed_assets'

export type ClipSourceRole =
  | 'main_story'
  | 'hook_candidate'
  | 'context'
  | 'proof'
  | 'b_roll'
  | 'speaker'
  | 'product'
  | 'transition'
  | 'ending'
  | 'optional'
  | 'unknown'

export interface SourceSequenceReviewState {
  mode: SourceSequenceMode
  confirmed: boolean
  confirmedAt?: string
  userGuidance?: string
  aiNotes: string[]
}

export type ProfessionalEditStyleId =
  | 'clean_professional'
  | 'premium_clean'
  | 'high_retention_social'
  | 'cinematic_story'
  | 'documentary_evidence'
  | 'education_explainer'
  | 'luxury_real_estate'
  | 'business_product'
  | 'lifestyle_natural'
  | 'energetic_creator'
  | 'custom'

export type PacingStyleId =
  | 'natural'
  | 'clean_tight'
  | 'fast_social'
  | 'high_retention'
  | 'cinematic_slow_build'
  | 'documentary_measured'
  | 'educational_structured'
  | 'luxury_smooth'
  | 'comedy_timing'
  | 'emotional_pause'
  | 'custom'

export type CutIntensity =
  | 'minimal'
  | 'balanced'
  | 'tight'
  | 'aggressive'
  | 'beat_synced'
  | 'cinematic'

export type TransitionFamilyId =
  | 'clean_cut_transitions'
  | 'smooth_premium_transitions'
  | 'social_viral_transitions'
  | 'graphic_motion_design_transitions'
  | 'documentary_evidence_transitions'
  | 'stroke_motion_transitions'
  | 'custom'

export type ColorGradeStyleId =
  | 'clean_natural'
  | 'premium_clean'
  | 'warm_lifestyle'
  | 'cinematic_contrast'
  | 'documentary_neutral'
  | 'luxury_real_estate'
  | 'corporate_neutral'
  | 'bright_social'
  | 'moody_dramatic'
  | 'film_emulation_light'
  | 'muted_editorial'
  | 'high_key_clean'
  | 'monochrome'
  | 'custom'

export type CaptionStyleId =
  | 'clean_subtitle'
  | 'small_premium_subtitle'
  | 'bold_social_captions'
  | 'keyword_emphasis_captions'
  | 'karaoke_word_by_word'
  | 'sentence_block_captions'
  | 'documentary_lower_third'
  | 'education_label_captions'
  | 'minimal_accessibility_captions'
  | 'caption_icon_callout'
  | 'custom'

export type BrollPolicyId =
  | 'none'
  | 'minimal_support_only'
  | 'support_key_points'
  | 'high_visual_variety'
  | 'proof_first_b_roll'
  | 'documentary_evidence_b_roll'
  | 'product_feature_b_roll'
  | 'lifestyle_atmosphere_b_roll'
  | 'uploaded_footage_first'
  | 'ai_generated_only_if_approved'
  | 'custom'

export type SoundStyleId =
  | 'clean_voice_only'
  | 'subtle_premium_bed'
  | 'energetic_social'
  | 'cinematic_emotional'
  | 'documentary_serious'
  | 'corporate_clean'
  | 'lifestyle_warm'
  | 'luxury_soft'
  | 'high_retention_impact'
  | 'custom'

export type EditingOperationType =
  | 'cut'
  | 'trim'
  | 'reorder'
  | 'speed_change'
  | 'silence_removal'
  | 'filler_word_removal'
  | 'caption'
  | 'b_roll'
  | 'color_grade'
  | 'audio_cleanup'
  | 'sound_cleanup'
  | 'music'
  | 'sfx'
  | 'transition'
  | 'visual_asset'
  | 'renderer_layer'
  | 'frame_layout'
  | 'qa_check'

export interface ProfessionalEditingDirective {
  editStyle: ProfessionalEditStyleId
  pacingStyle: PacingStyleId
  cutIntensity: CutIntensity
  transitionFamilies: TransitionFamilyId[]
  colorGradeStyle: ColorGradeStyleId
  captionStyle: CaptionStyleId
  brollPolicy: BrollPolicyId
  soundStyle: SoundStyleId
  mustFollowRules: string[]
  avoidRules: string[]
  customDirectives: CustomEditingDirective[]
  qaChecks: string[]
}

export interface CustomEditingDirective {
  id: string
  rawUserRequest: string
  interpretedMeaning: string
  mappedPresetIds: string[]
  customOverrides: string[]
  mustFollowRules: string[]
  avoidRules: string[]
  confidence: 'low' | 'medium' | 'high'
  clarifyingQuestions: string[]
}

export interface TierQualityStandard {
  editLevel: EditLevel
  label: string
  qualityPromise: string
  includedProfessionalBasics: string[]
  allowedComplexity: string[]
  fallbackPolicy: string[]
  notAllowed: string[]
  qaChecks: string[]
}

export type IntentConfidence =
  | 'low'
  | 'medium'
  | 'high'

export type IntentRequirementKind =
  | 'must_follow'
  | 'avoid'
  | 'preference'
  | 'constraint'
  | 'unclear'
  | 'question'

export type ClarifyingQuestionPriority =
  | 'blocking'
  | 'recommended'
  | 'optional'

export type IntentSource =
  | 'user_chat'
  | 'uploaded_media'
  | 'reference_video'
  | 'category_default'
  | 'edit_level_default'
  | 'ontology_default'
  | 'system_constraint'

export interface CompiledIntentRequirement {
  id: string
  kind: IntentRequirementKind
  text: string
  source: IntentSource
  priority: 'low' | 'medium' | 'high'
  mappedField?: string
  notes?: string
}

export interface ClarifyingQuestion {
  id: string
  question: string
  reason: string
  priority: ClarifyingQuestionPriority
  blocksPlanning: boolean
  suggestedAnswers?: string[]
  resolved?: boolean
  answer?: string
}

export interface LockedTierConstraint {
  id: string
  label: string
  rule: string
  applies: boolean
  userFacingMessage: string
}

export interface ResolvedEditingSettings {
  editingCategory: EditingCategory
  editLevel: EditLevel
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  frameTemplateType?: FrameTemplateType
  visualPreference: VisualPreference
  moodStyle: MoodStyle
  creditPreference: CreditPreference
}

export interface CompiledEditingIntent {
  id: string
  goalSummary: string
  resolvedSettings: ResolvedEditingSettings
  professionalEditingDirective: ProfessionalEditingDirective
  requirements: CompiledIntentRequirement[]
  mustFollowRules: string[]
  avoidRules: string[]
  customDirectives: CustomEditingDirective[]
  clarifyingQuestions: ClarifyingQuestion[]
  lockedTierConstraints: LockedTierConstraint[]
  confidence: IntentConfidence
  qaImplications: string[]
  compilerNotes: string[]
}

export type VisualAssetType =
  | 'animated_scene'
  | 'still_scene'
  | 'fact_card'
  | 'name_card'
  | 'character_card'
  | 'list_card'
  | 'timeline_card'
  | 'graphic_design_frame'
  | 'motion_design_scene'
  | 'real_motion_scene'
  | 'still_with_editor_motion'
  | 'transition_scene'

export type ProviderModel =
  | 'gpt_image_2'
  | 'wan_2_2_kf2v_flash'
  | 'wan_2_6_i2v_flash'
  | 'hailuo_2_3_fast'
  | 'hailuo_02'
  | 'veo_3_1_lite'
  | 'remotion_editor_motion'
  | 'svg_lottie_renderer'
  | 'none'

export type ColorPipelineStage =
  | 'source_analysis'
  | 'basic_correction'
  | 'shot_matching'
  | 'look_grade'
  | 'generated_asset_matching'
  | 'ai_video_asset_matching'
  | 'output_transform'
  | 'qa_check'
  | 'none'

export type ColorCorrectionScope =
  | 'full_project'
  | 'clip'
  | 'segment'
  | 'visual_asset'
  | 'ai_video_asset'
  | 'generated_image'
  | 'renderer_layer'

export type ColorPipelineToolId =
  | 'ffmpeg'
  | 'opencolorio'
  | 'openimageio'
  | 'opencv'
  | 'sharp'
  | 'remotion_preview'
  | 'planning_only'

export type ColorOperationId =
  | 'exposure_correction'
  | 'white_balance'
  | 'contrast_curve'
  | 'highlight_recovery'
  | 'shadow_control'
  | 'black_point'
  | 'white_point'
  | 'saturation'
  | 'vibrance'
  | 'temperature'
  | 'tint'
  | 'noise_reduction'
  | 'sharpening'
  | 'clarity'
  | 'skin_tone_protection'
  | 'shot_matching'
  | 'lut_application'
  | 'look_transform'
  | 'display_transform'
  | 'generated_asset_match'
  | 'ai_video_asset_match'
  | 'panel_background_match'
  | 'output_color_transform'
  | 'qa_histogram_check'
  | 'qa_skin_tone_check'
  | 'qa_background_match_check'

export type ColorIntensity =
  | 'subtle'
  | 'balanced'
  | 'strong'
  | 'stylized'

export type ColorPipelineStatus =
  | 'planned'
  | 'requires_approval'
  | 'future_worker'
  | 'blocked'
  | 'complete_mock'

export interface ColorOperationPlan {
  id: string
  operation: ColorOperationId
  label: string
  scope: ColorCorrectionScope
  toolId: ColorPipelineToolId
  intensity: ColorIntensity
  settings: Record<string, unknown>
  reason: string
  status: ColorPipelineStatus
  qaChecks: string[]
  workerNotes: string[]
}

export interface ClipColorPlan {
  id: string
  clipId: string
  clipLabel: string
  colorGradeStyle: ColorGradeStyleId
  correctionOperations: ColorOperationPlan[]
  lookOperations: ColorOperationPlan[]
  shotMatchingNotes: string[]
  qualityIssues: VisualQualityIssue[]
  skinToneProtection: boolean
  referenceClipId?: string
  qaChecks: string[]
}

export interface AssetColorMatchPlan {
  id: string
  assetPlanItemId?: string
  rendererLayerId?: string
  providerModel?: ProviderModel
  assetLabel: string
  assetType: VisualAssetType | 'renderer_layer' | 'unknown'
  matchToColorGrade: ColorGradeStyleId
  matchPanelBackgroundColor?: string
  matchSourceClipIds: string[]
  operations: ColorOperationPlan[]
  qaChecks: string[]
  notes: string[]
}

export interface ColorPipelinePlan {
  id: string
  summary: string
  colorGradeStyle: ColorGradeStyleId
  intensity: ColorIntensity
  stages: ColorPipelineStage[]
  toolsPlanned: ColorPipelineToolId[]
  projectOperations: ColorOperationPlan[]
  clipPlans: ClipColorPlan[]
  assetMatchPlans: AssetColorMatchPlan[]
  tierNotes: string[]
  generatedAssetRules: string[]
  qaChecks: string[]
  limitations: string[]
  status: ColorPipelineStatus
}

export type AudioPipelineStage =
  | 'source_audio_analysis'
  | 'voice_cleanup'
  | 'loudness_normalization'
  | 'silence_cleanup'
  | 'music_bed_planning'
  | 'ducking'
  | 'sfx_planning'
  | 'beat_sync'
  | 'sound_sync_cues'
  | 'output_audio_transform'
  | 'qa_check'
  | 'none'

export type AudioPipelineToolId =
  | 'ffmpeg'
  | 'audioflux'
  | 'essentia'
  | 'librosa'
  | 'signalsmith_stretch'
  | 'rubber_band'
  | 'whisper_cpp'
  | 'remotion_timing_preview'
  | 'planning_only'

export type AudioOperationId =
  | 'noise_reduction'
  | 'voice_leveling'
  | 'de_essing'
  | 'eq_cleanup'
  | 'compression'
  | 'loudness_normalization'
  | 'true_peak_limit'
  | 'silence_cleanup'
  | 'breath_reduction'
  | 'filler_pause_cleanup'
  | 'music_bed'
  | 'music_ducking'
  | 'sfx_hit'
  | 'transition_sound'
  | 'riser'
  | 'whoosh'
  | 'ambient_bed'
  | 'beat_detection'
  | 'onset_detection'
  | 'bpm_detection'
  | 'mood_energy_analysis'
  | 'tempo_adjustment'
  | 'pitch_adjustment'
  | 'caption_timing_alignment'
  | 'visual_reveal_timing'
  | 'qa_loudness_check'
  | 'qa_music_over_voice_check'
  | 'qa_sfx_density_check'
  | 'qa_clipping_check'

export type MusicPolicy =
  | 'none'
  | 'optional_subtle'
  | 'required_subtle'
  | 'energetic'
  | 'cinematic'
  | 'documentary_bed'
  | 'luxury_soft'
  | 'custom'

export type SfxPolicy =
  | 'none'
  | 'minimal'
  | 'support_transitions'
  | 'support_key_moments'
  | 'beat_synced'
  | 'high_impact'
  | 'custom'

export type SfxIntensity =
  | 'none'
  | 'subtle'
  | 'balanced'
  | 'strong'

export type BeatSyncStrategy =
  | 'none'
  | 'light'
  | 'cut_on_major_beats'
  | 'visual_reveal_on_beats'
  | 'caption_emphasis_on_beats'
  | 'full_soundsync'

export type AudioIntensity =
  | 'clean'
  | 'subtle'
  | 'balanced'
  | 'energetic'
  | 'cinematic'
  | 'high_impact'

export type AudioPipelineStatus =
  | 'planned'
  | 'requires_approval'
  | 'future_worker'
  | 'blocked'
  | 'complete_mock'

export type SoundSyncCueType =
  | 'cut'
  | 'caption_emphasis'
  | 'visual_reveal'
  | 'transition'
  | 'sfx_hit'
  | 'music_duck'
  | 'beat_marker'
  | 'emotional_pause'
  | 'map_pin_drop'
  | 'card_reveal'
  | 'count_up'
  | 'custom'

export interface AudioOperationPlan {
  id: string
  operation: AudioOperationId
  label: string
  toolId: AudioPipelineToolId
  settings: Record<string, unknown>
  reason: string
  status: AudioPipelineStatus
  qaChecks: string[]
  workerNotes: string[]
}

export interface ClipAudioPlan {
  id: string
  clipId: string
  clipLabel: string
  voiceClarity: 'poor' | 'fair' | 'good' | 'excellent'
  audioIssues: AudioQualityIssue[]
  cleanupOperations: AudioOperationPlan[]
  loudnessOperations: AudioOperationPlan[]
  musicAndDuckingNotes: string[]
  sfxNotes: string[]
  qaChecks: string[]
}

export interface MusicBedPlan {
  id: string
  policy: MusicPolicy
  soundStyle: SoundStyleId
  energy: AudioIntensity
  duckingEnabled: boolean
  duckingStrength: 'none' | 'light' | 'medium' | 'strong'
  introAllowed: boolean
  outroAllowed: boolean
  fadeInSeconds: number
  fadeOutSeconds: number
  reason: string
  avoidRules: string[]
  qaChecks: string[]
}

export interface SfxPlan {
  id: string
  policy: SfxPolicy
  intensity: SfxIntensity
  allowedSfxTypes: string[]
  maxSfxPerMinute: number
  cues: string[]
  avoidRules: string[]
  qaChecks: string[]
}

export interface SoundSyncCue {
  id: string
  cueType: SoundSyncCueType
  timeSeconds: number
  linkedSegmentId?: string
  linkedVisualAssetId?: string
  linkedRendererLayerId?: string
  intensity: SfxIntensity
  soundStyle: SoundStyleId
  reason: string
  qaChecks: string[]
}

export interface BeatSyncPlan {
  id: string
  strategy: BeatSyncStrategy
  bpmDetectionPlanned: boolean
  onsetDetectionPlanned: boolean
  cutOnBeat: boolean
  visualRevealOnBeat: boolean
  captionEmphasisOnBeat: boolean
  emotionalPauseProtection: boolean
  cues: SoundSyncCue[]
  notes: string[]
}

export interface AudioPipelinePlan {
  id: string
  summary: string
  soundStyle: SoundStyleId
  audioIntensity: AudioIntensity
  stages: AudioPipelineStage[]
  toolsPlanned: AudioPipelineToolId[]
  projectOperations: AudioOperationPlan[]
  clipPlans: ClipAudioPlan[]
  musicBedPlan: MusicBedPlan
  sfxPlan: SfxPlan
  beatSyncPlan: BeatSyncPlan
  soundSyncCues: SoundSyncCue[]
  tierNotes: string[]
  qaChecks: string[]
  limitations: string[]
  status: AudioPipelineStatus
}

export type MapVisualType =
  | 'location_pin'
  | 'route_reveal'
  | 'multi_location_sequence'
  | 'region_highlight'
  | 'real_estate_neighborhood'
  | 'travel_route'
  | 'documentary_case_map'
  | 'evidence_location_map'
  | 'money_movement_map'
  | 'screen_map_card'
  | 'map_behind_subject'
  | 'map_behind_subject_and_contact_object'
  | 'picture_in_picture_map'
  | 'side_by_side_map'
  | 'lower_panel_map'
  | 'full_map_takeover'
  | 'globe_reveal_future'
  | 'heatmap_future'
  | 'arc_flow_future'
  | 'custom'

export type MapStyleFamily =
  | 'clean_social_map'
  | 'documentary_evidence_map'
  | 'muted_case_study_map'
  | 'warm_lifestyle_travel_map'
  | 'real_estate_neighborhood_map'
  | 'business_location_map'
  | 'luxury_property_map'
  | 'dark_cinematic_map'
  | 'high_contrast_simple_map'
  | 'custom'

export type MapAnimationType =
  | 'static_hold'
  | 'pin_drop'
  | 'fly_to'
  | 'route_draw'
  | 'fit_bounds'
  | 'multi_stop_sequence'
  | 'region_pulse'
  | 'zoom_reveal'
  | 'pan_follow'
  | 'future_globe_orbit'
  | 'custom'

export type MapDataSourceType =
  | 'user_provided_location'
  | 'script_location'
  | 'clip_metadata'
  | 'manual_coordinates'
  | 'approximate_region'
  | 'fictional_location'
  | 'unknown'

export type LocationConfidence =
  | 'exact'
  | 'approximate'
  | 'unknown'
  | 'fictional'

export type LocationClaimStatus =
  | 'verified'
  | 'alleged'
  | 'claimed_by_source'
  | 'approximate'
  | 'fictional'
  | 'unknown'

export interface MapCoordinate {
  longitude: number
  latitude: number
  label?: string
}

export interface MapLocationPlan {
  id: string
  label: string
  dataSource: MapDataSourceType
  confidence: LocationConfidence
  claimStatus: LocationClaimStatus
  coordinates?: MapCoordinate
  approximateRegion?: string
  sourceNeeded: boolean
  sourceLabel?: string
  safeWording: string
  notes: string[]
}

export interface MapStylePlan {
  styleFamily: MapStyleFamily
  baseMapStyle: string
  labelDensity: 'low' | 'medium' | 'high'
  colorPalette: string[]
  routeColor: string
  markerColor: string
  highlightColor: string
  documentaryNeutrality: boolean
  darkMode: boolean
  notes: string[]
}

export interface MapCameraPlan {
  animationType: MapAnimationType
  center?: MapCoordinate
  zoom?: number
  bearing?: number
  pitch?: number
  flyDurationMs?: number
  flySpeed?: number
  curve?: number
  easing?: string
  fitBounds?: {
    coordinates: MapCoordinate[]
    padding: number
  }
  holdDurationMs?: number
  notes: string[]
}

export interface MapRoutePlan {
  id: string
  routeCoordinates: MapCoordinate[]
  routeLabel: string
  routeRevealDurationMs: number
  routeLineColor: string
  routeLineWidth: number
  routeLineDash?: string
  direction: 'start_to_end' | 'end_to_start' | 'bidirectional'
  notes: string[]
}

export interface MapLayoutPlan {
  layoutMode: SpeakerVisualLayoutMode
  frameTemplateType: FrameTemplateType
  mapZone?: RectZone
  speakerZone?: RectZone
  captionSafeZone?: RectZone
  safeMargins: number
  panelBackgroundColor: string
  foregroundMaskAware: boolean
  expectedForegroundZone?: RectZone
  labelAvoidZones: RectZone[]
  depthCompositingMode?: DepthCompositingMode
  maskStrategy?: MaskStrategy
  fallbackLayoutMode?: SpeakerVisualLayoutMode
  notes: string[]
}

export interface MapAnimationPlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  visualAssetPlanItemId?: string
  speakerVisualLayoutItemId?: string
  depthAwareOverlayItemId?: string
  mapVisualType: MapVisualType
  title: string
  purpose: string
  locations: MapLocationPlan[]
  style: MapStylePlan
  camera: MapCameraPlan
  route?: MapRoutePlan
  layout: MapLayoutPlan
  toolChain: ToolChainId
  toolIds: OpenSourceToolId[]
  remotionCapabilities: RemotionCapabilityId[]
  soundSyncCueIds: string[]
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  tierAllowed: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  reason: string
  fallbackStrategy: string[]
  qaChecks: string[]
  workerNotes: string[]
}

export interface MapAnimationPlan {
  id: string
  active: boolean
  summary: string
  items: MapAnimationPlanItem[]
  mapToolsPlanned: OpenSourceToolId[]
  globalRules: string[]
  qaChecks: string[]
  limitations: string[]
  notes: string[]
}

export type DataVizVisualType =
  | 'money_flow_diagram'
  | 'account_flow_diagram'
  | 'process_step_diagram'
  | 'timeline_diagram'
  | 'before_after_comparison'
  | 'metric_card'
  | 'bar_chart'
  | 'line_chart'
  | 'area_chart'
  | 'pie_or_donut_chart'
  | 'funnel_chart'
  | 'gauge_chart'
  | 'table_card'
  | 'network_graph'
  | 'hierarchy_tree'
  | 'cause_effect_diagram'
  | 'pros_cons_comparison'
  | 'feature_comparison'
  | 'evidence_flow_diagram'
  | 'claim_support_diagram'
  | 'document_breakdown_card'
  | 'custom_visual_explain'

export type DataVizStyleFamily =
  | 'clean_visual_explain'
  | 'documentary_evidence_diagram'
  | 'money_flow_evidence'
  | 'business_dashboard'
  | 'education_step_by_step'
  | 'premium_product_comparison'
  | 'social_metric_card'
  | 'minimalist_table_card'
  | 'cinematic_story_diagram'
  | 'custom'

export type DataVizToolPreference =
  | 'd3'
  | 'echarts'
  | 'vega_lite_future'
  | 'remotion_only'
  | 'gpt_image_frame_only'
  | 'custom'

export type DataSourceType =
  | 'user_provided'
  | 'script_claim'
  | 'transcript_claim'
  | 'uploaded_document'
  | 'mock_demo_data'
  | 'fictional_story_data'
  | 'unknown'

export type DataConfidence =
  | 'verified'
  | 'reported'
  | 'claimed'
  | 'approximate'
  | 'fictional'
  | 'mock'
  | 'unknown'

export type DiagramFlowDirection =
  | 'left_to_right'
  | 'right_to_left'
  | 'top_to_bottom'
  | 'bottom_to_top'
  | 'radial'
  | 'network'
  | 'timeline'
  | 'custom'

export type DataVizAnimationType =
  | 'static_hold'
  | 'card_pop'
  | 'step_reveal'
  | 'count_up'
  | 'line_draw'
  | 'bar_grow'
  | 'arrow_flow'
  | 'node_pop'
  | 'timeline_slide'
  | 'highlight_pulse'
  | 'sequence_build'
  | 'custom'

export interface DataVizDataPoint {
  id: string
  label: string
  value?: number | string
  unit?: string
  category?: string
  dateLabel?: string
  confidence: DataConfidence
  sourceLabel?: string
  notes: string[]
}

export interface DataVizNode {
  id: string
  label: string
  nodeType: 'person' | 'account' | 'company' | 'location' | 'step' | 'object' | 'document' | 'claim' | 'metric' | 'custom'
  confidence: DataConfidence
  sourceLabel?: string
  visualRole: 'primary' | 'secondary' | 'supporting' | 'background'
  notes: string[]
}

export interface DataVizEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label?: string
  direction: DiagramFlowDirection
  confidence: DataConfidence
  sourceLabel?: string
  notes: string[]
}

export interface DataVizDataPlan {
  id: string
  dataSourceType: DataSourceType
  confidence: DataConfidence
  sourceNeeded: boolean
  sourceLabel?: string
  safeWording: string
  mockData: boolean
  fictionalData: boolean
  dataPoints: DataVizDataPoint[]
  nodes: DataVizNode[]
  edges: DataVizEdge[]
  qaChecks: string[]
  notes: string[]
}

export interface DataVizStylePlan {
  styleFamily: DataVizStyleFamily
  colorPalette: string[]
  highlightColor: string
  labelDensity: 'low' | 'medium' | 'high'
  typographyScale: 'compact' | 'normal' | 'large'
  lineWeight: 'thin' | 'medium' | 'thick'
  cardStyle: string
  documentaryNeutrality: boolean
  brandColorUse: boolean
  playfulElementsAllowed: boolean
  notes: string[]
}

export interface DataVizAnimationPlan {
  animationType: DataVizAnimationType
  durationMs: number
  revealOrder: string[]
  easing: string
  soundSyncCueIds: string[]
  notes: string[]
}

export interface DataVizLayoutPlan {
  layoutMode: SpeakerVisualLayoutMode
  frameTemplateType: FrameTemplateType
  visualZone?: RectZone
  speakerZone?: RectZone
  captionSafeZone?: RectZone
  safeMargins: number
  panelBackgroundColor: string
  labelAvoidZones: RectZone[]
  maxLabelCount?: number
  compactMode: boolean
  fullTakeoverMode: boolean
  notes: string[]
}

export interface DataVizPlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  visualAssetPlanItemId?: string
  speakerVisualLayoutItemId?: string
  renderStrategyItemId?: string
  toolStrategyItemId?: string
  visualType: DataVizVisualType
  title: string
  purpose: string
  dataPlan: DataVizDataPlan
  style: DataVizStylePlan
  animation: DataVizAnimationPlan
  layout: DataVizLayoutPlan
  preferredTool: DataVizToolPreference
  toolChain: ToolChainId
  toolIds: OpenSourceToolId[]
  remotionCapabilities: RemotionCapabilityId[]
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  tierAllowed: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  reason: string
  whyNotAiVideo: string
  fallbackStrategy: string[]
  qaChecks: string[]
  workerNotes: string[]
}

export interface DataVizPlan {
  id: string
  active: boolean
  summary: string
  items: DataVizPlanItem[]
  toolsPlanned: OpenSourceToolId[]
  globalRules: string[]
  qaChecks: string[]
  limitations: string[]
  notes: string[]
}

export interface RectZone {
  x: number
  y: number
  width: number
  height: number
  label?: string
  notes?: string
}

export interface FrameLayoutPlan {
  templateType: FrameTemplateType
  aspectRatio: AspectRatio
  canvasWidth: number
  canvasHeight: number
  speakerZone?: RectZone
  animationZone: RectZone
  captionSafeZone?: RectZone
  safeMargin: number
  panelBackgroundColor: string
  notes: string[]
}

export interface SpeakerVisualLayoutPlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  layoutMode: SpeakerVisualLayoutMode
  speakerPresence: SpeakerPresenceMode
  visualDominance: VisualDominanceMode
  frameTemplateType: FrameTemplateType
  platformFit: TargetPlatform
  recommendedForAspectRatio: AspectRatio
  speakerZone?: RectZone
  visualZone?: RectZone
  captionZone?: RectZone
  safeMargin: number
  panelBackgroundColor?: string
  complexity: LayoutComplexity
  riskLevel: LayoutRiskLevel
  tierAvailability: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  preferredTools: string[]
  reason: string
  avoidRules: string[]
  fallbackLayoutMode?: SpeakerVisualLayoutMode
  depthCompositingMode?: DepthCompositingMode
  maskStrategy?: MaskStrategy
  maskRisk?: MaskRiskLevel
  trackingRequirement?: TrackingRequirement
  depthAwareOverlayItemId?: string
  promptImplications: string[]
  remotionNotes: string[]
  qaChecks: string[]
}

export interface SpeakerVisualLayoutPlan {
  id: string
  summary: string
  items: SpeakerVisualLayoutPlanItem[]
  globalRules: string[]
  qaChecks: string[]
  notes: string[]
}

export interface ForegroundObjectPlan {
  id: string
  label: string
  kind: ForegroundObjectKind
  description: string
  preserveInFrontOfOverlay: boolean
  reason: string
  expectedZone?: RectZone
  maskDifficulty: MaskRiskLevel
  trackingRequirement: TrackingRequirement
  qaChecks: string[]
}

export interface ForegroundDepthGroup {
  id: string
  label: string
  mainSubjectIds: string[]
  contactObjectIds: string[]
  heroObjectIds: string[]
  sceneAnchorObjectIds: string[]
  preserveGroupInFront: boolean
  reason: string
  maskStrategy: MaskStrategy
  maskRisk: MaskRiskLevel
  trackingRequirement: TrackingRequirement
  fallbackLayoutMode?: SpeakerVisualLayoutMode
  qaChecks: string[]
}

export interface DepthAwareOverlayPlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  speakerVisualLayoutItemId?: string
  depthCompositingMode: DepthCompositingMode
  maskStrategy: MaskStrategy
  foregroundObjects: ForegroundObjectPlan[]
  foregroundDepthGroups: ForegroundDepthGroup[]
  overlayLayerDescription: string
  overlayShouldSitBehind: string[]
  overlayShouldSitInFrontOf: string[]
  captionLayerRule: string
  maskRisk: MaskRiskLevel
  trackingRequirement: TrackingRequirement
  tierAllowed: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  complexityCreditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  reason: string
  fallbackLayoutMode?: SpeakerVisualLayoutMode
  promptImplications: string[]
  remotionLayerNotes: string[]
  qaChecks: string[]
  workerNotes: string[]
}

export interface DepthAwareOverlayPlan {
  id: string
  active: boolean
  summary: string
  items: DepthAwareOverlayPlanItem[]
  globalRules: string[]
  qaChecks: string[]
  notes: string[]
}

export interface ClipUnderstandingItem {
  clipId: string
  uploadedOrder: number
  fileName: string
  duration: string
  detectedRole: ClipAnalysisRole
  roleConfidence: VideoUnderstandingConfidence
  transcriptSummary: string
  visualSummary: string
  audioSummary: string
  strongMoments: string[]
  weakMoments: string[]
  hookCandidates: string[]
  brollOpportunities: string[]
  visualSupportOpportunities: VisualSupportOpportunityType[]
  toolStrategyHints: ToolStrategyHint[]
  visualQualityIssues: VisualQualityIssue[]
  audioQualityIssues: AudioQualityIssue[]
  safeZoneNotes: string[]
  faceOrSpeakerNotes: string[]
  productOrObjectNotes: string[]
  foregroundDepthNotes: string[]
  aiNotes: string[]
}

export interface TranscriptMeaningReport {
  summary: string
  keyPhrases: string[]
  hookLines: string[]
  emotionalLines: string[]
  explanationLines: string[]
  proofOrClaimLines: string[]
  ctaLines: string[]
  unclearLines: string[]
  visualSupportNeeded: VisualSupportOpportunityType[]
  captionDensityRecommendation: 'low' | 'medium' | 'high'
  notes: string[]
}

export interface VisualUnderstandingReport {
  sceneTypeSummary: string
  speakerFraming: string
  faceSafeZoneNotes: string[]
  productSafeZoneNotes: string[]
  emptySpaceOpportunities: string[]
  foregroundOpportunities: string[]
  contactObjectOpportunities: string[]
  depthCompositionOpportunities: string[]
  brollQualityNotes: string[]
  colorLightingIssues: VisualQualityIssue[]
  notes: string[]
}

export interface AudioUnderstandingReport {
  voiceClarity: 'poor' | 'fair' | 'good' | 'excellent'
  musicPresent: boolean
  noiseLevel: 'low' | 'medium' | 'high'
  loudnessConsistency: 'poor' | 'fair' | 'good'
  cleanupNeeded: boolean
  soundSyncOpportunities: string[]
  audioIssues: AudioQualityIssue[]
  notes: string[]
}

export interface VisualSupportOpportunity {
  id: string
  clipId?: string
  segmentId?: string
  opportunityType: VisualSupportOpportunityType
  label: string
  reason: string
  suggestedSignatureSystem: SignatureSystem
  suggestedLayoutMode?: SpeakerVisualLayoutMode
  suggestedToolHints: ToolStrategyHint[]
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  priority: 'low' | 'medium' | 'high'
  qaChecks: string[]
}

export interface AdaptiveStrategyItem {
  id: string
  segmentId?: string
  clipId?: string
  label: string
  decision: string
  reason: string
  userIntentInfluence: string
  videoUnderstandingInfluence: string
  recommendedVisualSupport: VisualSupportOpportunityType
  recommendedLayoutMode?: SpeakerVisualLayoutMode
  recommendedToolHints: ToolStrategyHint[]
  avoidRules: string[]
  qaChecks: string[]
}

export interface AdaptiveEditStrategy {
  id: string
  summary: string
  items: AdaptiveStrategyItem[]
  globalRules: string[]
  notes: string[]
}

export interface AdaptiveStrategyReason {
  id: string
  source:
    | 'user_intent'
    | 'video_understanding'
    | 'reference_dna'
    | 'category_default'
    | 'edit_level'
    | 'platform'
    | 'quality_standard'
    | 'model_policy'
    | 'frame_layout'
    | 'fact_safety'
    | 'custom'
  explanation: string
  priority: StrategyPriority
}

export interface AdaptiveSegmentStrategy {
  id: string
  segmentId?: string
  clipId?: string
  label: string
  segmentRole?: EditSegmentRole
  decisionKind: AdaptiveDecisionKind
  creativeIntensity: CreativeIntensity
  generationRestraint: GenerationRestraint
  recommendedVisualSupport: VisualSupportOpportunityType
  recommendedSignatureSystem: SignatureSystem
  recommendedLayoutMode?: SpeakerVisualLayoutMode
  recommendedSpeakerPresence?: SpeakerPresenceMode
  recommendedVisualDominance?: VisualDominanceMode
  recommendedToolHints: ToolStrategyHint[]
  toolStrategyHintsDetailed?: ToolStrategyHintDetail[]
  recommendedAssetType?: VisualAssetType
  recommendedTransitionFamilies: TransitionFamilyId[]
  recommendedColorGrade: ColorGradeStyleId
  recommendedCaptionStyle: CaptionStyleId
  recommendedBrollPolicy: BrollPolicyId
  costComplexity: 'none' | 'low' | 'medium' | 'high' | 'premium'
  reasons: AdaptiveStrategyReason[]
  mustFollowRules: string[]
  avoidRules: string[]
  fallbackStrategy: string[]
  qaChecks: string[]
}

export interface AdaptiveHookStrategy {
  policy: HookPolicy
  recommendation: string
  selectedClipId?: string
  selectedLine?: string
  reason: string
  alternatives: string[]
}

export interface AdaptivePacingStrategy {
  pacingStyle: PacingStyleId
  cutIntensity: CutIntensity
  creativeIntensity: CreativeIntensity
  reason: string
  keepPausesWhere: string[]
  tightenWhere: string[]
  avoidRules: string[]
}

export interface AdaptiveVisualStrategySummary {
  speakerLedSegments: number
  visualTakeoverSegments: number
  brollSegments: number
  graphicSegments: number
  mapOrChartSegments: number
  aiVideoSegments: number
  stillCardSegments: number
  noExtraVisualSegments: number
  summary: string
}

export interface AdaptiveEditStrategyPlan {
  id: string
  summary: string
  hookStrategy: AdaptiveHookStrategy
  pacingStrategy: AdaptivePacingStrategy
  visualStrategySummary: AdaptiveVisualStrategySummary
  segmentStrategies: AdaptiveSegmentStrategy[]
  globalMustFollowRules: string[]
  globalAvoidRules: string[]
  tierConstraints: string[]
  modelPolicyNotes: string[]
  creditStrategyNotes: string[]
  qaChecks: string[]
  limitations: string[]
}

export interface VideoUnderstandingReport {
  id: string
  sourceSequenceMode?: SourceSequenceMode
  sourceOrderConfirmed: boolean
  overallSummary: string
  clips: ClipUnderstandingItem[]
  transcriptMeaning: TranscriptMeaningReport
  visualUnderstanding: VisualUnderstandingReport
  audioUnderstanding: AudioUnderstandingReport
  visualSupportOpportunities: VisualSupportOpportunity[]
  suggestedStrategy: AdaptiveEditStrategy
  adaptiveStrategyPlan?: AdaptiveEditStrategyPlan
  confidence: VideoUnderstandingConfidence
  limitations: string[]
  qaConcerns: string[]
  notes: string[]
}

export type RendererEngine =
  | 'remotion'
  | 'svg_lottie'
  | 'editor_motion'
  | 'ai_video_asset_only'
  | 'none'

export type RendererLayerType =
  | 'source_video'
  | 'speaker_video'
  | 'ai_video_panel'
  | 'still_image'
  | 'fact_card'
  | 'name_card'
  | 'character_card'
  | 'list_card'
  | 'timeline_card'
  | 'graphic_design'
  | 'motion_design'
  | 'foreground_mask'
  | 'caption'
  | 'sound_sync_marker'
  | 'transition'
  | 'background_panel'

export type LayerFitMode =
  | 'cover'
  | 'contain'
  | 'fill'
  | 'safe_contain'
  | 'panel_contain'

export interface RendererLayerPlan {
  id: string
  assetPlanItemId?: string
  layerType: RendererLayerType
  label: string
  startTimeSeconds: number
  endTimeSeconds: number
  zIndex: number
  zone: RectZone
  fitMode: LayerFitMode
  backgroundColor?: string
  opacity?: number
  motionPreset?: string
  notes: string[]
}

export interface RendererCompositionPlan {
  id: string
  engine: RendererEngine
  frameTemplate: FrameLayoutPlan
  durationSeconds: number
  fps: number
  masterTimingPlanId?: string
  layers: RendererLayerPlan[]
  captionSafeZone?: RectZone
  panelBackgroundColor: string
  rendererNotes: string[]
  approvalRequired: boolean
  renderReady: boolean
}

export type PromptPlanType =
  | 'image_prompt'
  | 'start_frame_prompt'
  | 'end_frame_prompt'
  | 'still_card_prompt'
  | 'graphic_design_prompt'
  | 'motion_design_prompt'
  | 'stroke_motion_video_prompt'
  | 'real_motion_video_prompt'
  | 'veo_fallback_prompt'
  | 'negative_prompt'
  | 'remotion_motion_brief'
  | 'qa_prompt_notes'

export type PromptTargetProvider =
  | 'gpt_image_2'
  | 'wan'
  | 'hailuo'
  | 'veo'
  | 'remotion'
  | 'editor_motion'
  | 'none'

export interface PromptConstraint {
  id: string
  label: string
  instruction: string
  source:
    | 'user_intent'
    | 'professional_editing_directive'
    | 'style_mode'
    | 'frame_layout'
    | 'provider_route'
    | 'qa'
    | 'video_understanding'
    | 'source_cleanup'
    | 'trim_review'
    | 'adaptive_strategy'
    | 'render_strategy'
    | 'tool_strategy'
    | 'color_pipeline'
    | 'audio_pipeline'
    | 'map_animation'
    | 'dataviz_plan'
    | 'tier_policy'
    | 'safety'
    | 'system'
  required: boolean
}

export interface ProviderPromptPlan {
  id: string
  assetPlanItemId?: string
  segmentId?: string
  planType: PromptPlanType
  targetProvider: PromptTargetProvider
  providerModel: ProviderModel
  title: string
  prompt: string
  negativePrompt?: string
  constraints: PromptConstraint[]
  frameTemplateType?: FrameTemplateType
  panelBackgroundColor?: string
  safeMarginNotes: string[]
  aspectRatioFrameNotes?: string[]
  sourceCleanupNotes?: string[]
  trimReviewNotes?: string[]
  timingNotes?: string[]
  captionVisualCueNotes?: string[]
  soundSyncTransitionNotes?: string[]
  providerClipTimingItemId?: string
  styleModeId?: string
  professionalEditStyle?: ProfessionalEditStyleId
  durationSeconds?: number
  resolution?: 'frame' | '720P' | '768P' | '1080P'
  tierAllowed: boolean
  tierPolicyNotes: string[]
  qaNotes: string[]
  workerNotes: string[]
  promptVersion: string
  characterPackIds?: string[]
  factSafetyItemIds?: string[]
  colorPipelineNotes?: string[]
  audioPipelineNotes?: string[]
  mapPlanNotes?: string[]
  dataVizPlanNotes?: string[]
}

export type CharacterImportance =
  | 'primary'
  | 'secondary'
  | 'mention_only'
  | 'group'
  | 'symbolic'

export type CharacterRealityStatus =
  | 'fictional'
  | 'real_named_person'
  | 'public_figure'
  | 'user_provided_person'
  | 'unknown'

export type CharacterReferenceAssetType =
  | 'neutral_pose'
  | 'emotional_pose'
  | 'action_pose'
  | 'side_pose'
  | 'character_card'
  | 'name_card'
  | 'lineup_card'
  | 'start_frame'
  | 'end_frame'
  | 'silhouette'
  | 'generic_figure'

export interface CharacterAppearance {
  visualDescription: string
  outfit?: string
  hair?: string
  accessories?: string
  bodyLanguage?: string
  colorRules?: string[]
  strokeRules?: string[]
  styleModeIds?: string[]
}

export interface CharacterReferenceAssetPlan {
  id: string
  assetType: CharacterReferenceAssetType
  label: string
  purpose: string
  providerModel: ProviderModel
  promptNotes: string[]
  required: boolean
}

export interface CharacterReferencePack {
  id: string
  displayName: string
  roleInStory: string
  importance: CharacterImportance
  realityStatus: CharacterRealityStatus
  appearance: CharacterAppearance
  expressionRange: string[]
  poseRange: string[]
  appearsInBeatIds: string[]
  appearsInSegmentIds: string[]
  referenceAssetsNeeded: CharacterReferenceAssetPlan[]
  consistencyRules: string[]
  avoidRules: string[]
  promptNotes: string[]
  qaChecks: string[]
}

export type FactClaimStatus =
  | 'fictional'
  | 'verified_fact'
  | 'allegation'
  | 'charge'
  | 'claim_by_source'
  | 'opinion'
  | 'unknown'

export type FactSafetyVisualTreatment =
  | 'neutral_name_card'
  | 'evidence_board_card'
  | 'timeline_card'
  | 'document_card'
  | 'money_trail_graphic'
  | 'source_attribution_card'
  | 'generic_silhouette'
  | 'stylized_non_realistic_figure'
  | 'no_visual'
  | 'needs_user_confirmation'

export interface FactSafetyPlanItem {
  id: string
  claimText: string
  peopleMentioned: string[]
  organizationsMentioned: string[]
  claimStatus: FactClaimStatus
  sourceNeeded: boolean
  sourceLabel?: string
  safeWording: string
  visualTreatment: FactSafetyVisualTreatment
  avoidRules: string[]
  clarifyingQuestion?: ClarifyingQuestion
  qaChecks: string[]
  severity: 'low' | 'medium' | 'high' | 'blocking'
}

export interface CharacterConsistencyPlan {
  id: string
  packs: CharacterReferencePack[]
  globalRules: string[]
  qaChecks: string[]
  notes: string[]
}

export interface DocumentaryFactSafetyPlan {
  id: string
  active: boolean
  claimItems: FactSafetyPlanItem[]
  globalRules: string[]
  clarifyingQuestions: ClarifyingQuestion[]
  qaChecks: string[]
  notes: string[]
}

export type EditSegmentRole =
  | 'hook'
  | 'setup'
  | 'context'
  | 'proof'
  | 'explanation'
  | 'example'
  | 'emotional_beat'
  | 'reveal'
  | 'transition'
  | 'recap'
  | 'call_to_action'
  | 'ending'
  | 'montage'
  | 'b_roll_support'
  | 'title_card'
  | 'evidence_card'
  | 'visual_explainer'
  | 'custom'

export type EditOperationStatus =
  | 'planned'
  | 'approved'
  | 'ready_for_worker'
  | 'running'
  | 'complete'
  | 'failed'
  | 'skipped'
  | 'needs_review'

export type QAStatus =
  | 'not_checked'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'needs_user_review'
  | 'retry_allowed'
  | 'blocked'

export type QACategory =
  | 'video_understanding'
  | 'adaptive_strategy'
  | 'source_cleanup'
  | 'trim_review'
  | 'editing_agent_execution'
  | 'async_asset_reconciliation'
  | 'agent_qa_fallback'
  | 'user_intent_match'
  | 'source_order_and_structure'
  | 'pacing_and_cuts'
  | 'master_timing'
  | 'caption_visual_cue_timing'
  | 'timing_validation'
  | 'captions'
  | 'color_grade'
  | 'b_roll'
  | 'sound_sync'
  | 'transitions'
  | 'visual_assets'
  | 'frame_layout'
  | 'render_strategy'
  | 'tool_strategy'
  | 'color_pipeline'
  | 'audio_pipeline'
  | 'map_animation'
  | 'dataviz_plan'
  | 'model_tier_policy'
  | 'credit_approval'
  | 'safety_and_claims'
  | 'render_composition'

export interface TimeRange {
  startSeconds: number
  endSeconds: number
  label?: string
}

export type TimingCueType =
  | 'source_trim'
  | 'final_segment'
  | 'speech_line'
  | 'caption_chunk'
  | 'caption_emphasis'
  | 'visual_reveal'
  | 'visual_hold'
  | 'visual_exit'
  | 'map_pin_drop'
  | 'map_route_reveal'
  | 'chart_build'
  | 'browser_zoom'
  | 'stroke_motion_clip'
  | 'ai_video_clip'
  | 'transition'
  | 'sfx'
  | 'music_duck'
  | 'beat'
  | 'downbeat'
  | 'onset'
  | 'emotional_pause'
  | 'remotion_layer'
  | 'provider_clip'
  | 'qa_marker'
  | 'custom'

export type TimingPriority =
  | 'speech_clarity'
  | 'story_meaning'
  | 'visual_readability'
  | 'music_rhythm'
  | 'motion_smoothness'
  | 'retention'
  | 'decorative'

export type TimingPlanStatus =
  | 'draft'
  | 'ready'
  | 'blocked'
  | 'needs_frame_confirmation'
  | 'needs_audio_analysis'
  | 'needs_transcript_alignment'
  | 'approved_mock'

export type TimingSnapMode =
  | 'none'
  | 'speech_boundary'
  | 'beat'
  | 'downbeat'
  | 'onset'
  | 'visual_cue'
  | 'manual'

export type TimingRiskLevel = 'low' | 'medium' | 'high' | 'blocking'

export type CaptionChunkingMode =
  | 'phrase_based'
  | 'sentence_based'
  | 'word_pop'
  | 'keyword_emphasis'
  | 'subtitle_block'
  | 'minimal_caption'
  | 'no_caption'

export type CaptionAnimationTimingStyle =
  | 'none'
  | 'fade'
  | 'soft_pop'
  | 'word_highlight'
  | 'kinetic_word_pop'
  | 'slide_up'
  | 'typewriter'
  | 'documentary_lower_third'
  | 'premium_minimal'

export type CaptionReadabilityRisk = 'low' | 'medium' | 'high' | 'blocking'

export type VisualCueTriggerType =
  | 'speech_phrase_start'
  | 'keyword_spoken'
  | 'phrase_end'
  | 'pause_after_phrase'
  | 'beat'
  | 'downbeat'
  | 'onset'
  | 'emotional_shift'
  | 'visual_action'
  | 'transition_boundary'
  | 'manual_planned'

export type VisualCueSyncStatus =
  | 'synced'
  | 'draft'
  | 'needs_transcript_alignment'
  | 'needs_audio_analysis'
  | 'blocked'

export type VisualCueType =
  | 'card_reveal'
  | 'name_card_reveal'
  | 'fact_card_reveal'
  | 'evidence_card_reveal'
  | 'map_pin_drop'
  | 'map_route_start'
  | 'map_route_complete'
  | 'chart_start'
  | 'chart_step_reveal'
  | 'chart_complete'
  | 'browser_zoom_start'
  | 'browser_highlight'
  | 'stroke_motion_start'
  | 'stroke_motion_emphasis'
  | 'ai_video_panel_start'
  | 'ai_video_panel_end'
  | 'lower_panel_enter'
  | 'full_takeover_enter'
  | 'full_takeover_exit'
  | 'depth_overlay_enter'
  | 'foreground_mask_moment'
  | 'transition_in'
  | 'transition_out'
  | 'custom'

export type SoundSyncAnalysisStatus =
  | 'not_needed'
  | 'mock_planned'
  | 'needs_audioflux_analysis'
  | 'ready_mock'
  | 'blocked'

export type MusicPhraseType =
  | 'intro'
  | 'build'
  | 'verse'
  | 'chorus'
  | 'drop'
  | 'bridge'
  | 'outro'
  | 'silence'
  | 'voice_only'
  | 'unknown'

export type BeatSnapDecision =
  | 'snap_to_beat'
  | 'snap_to_downbeat'
  | 'snap_to_onset'
  | 'snap_to_phrase_boundary'
  | 'do_not_snap'
  | 'manual'

export type TransitionTimingType =
  | 'hard_cut'
  | 'phrase_cut'
  | 'beat_cut'
  | 'downbeat_cut'
  | 'match_cut'
  | 'visual_motivated_cut'
  | 'audio_motivated_cut'
  | 'smooth_crossfade'
  | 'whip_or_push'
  | 'graphic_wipe'
  | 'card_wipe'
  | 'map_transition'
  | 'chart_transition'
  | 'browser_zoom_transition'
  | 'stroke_motion_transition'
  | 'evidence_board_transition'
  | 'documentary_cut'
  | 'custom'

export type TransitionRiskLevel = 'low' | 'medium' | 'high' | 'blocking'

export type SfxDensityLevel =
  | 'none'
  | 'low'
  | 'balanced'
  | 'high'
  | 'premium_refined'

export type DuckingReasonType =
  | 'voice_clarity'
  | 'important_phrase'
  | 'caption_heavy_section'
  | 'documentary_source_line'
  | 'emotional_pause'
  | 'visual_montage'
  | 'outro'
  | 'custom'

export interface FrameTimeRange {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  startFrame: number
  endFrame: number
  durationFrames: number
  fps: number
}

export interface TimingCue {
  id: string
  cueType: TimingCueType
  label: string
  timeRange: FrameTimeRange
  priority: TimingPriority
  snapMode: TimingSnapMode
  linkedClipId?: string
  linkedSegmentId?: string
  linkedTranscriptLineId?: string
  linkedVisualAssetPlanItemId?: string
  linkedRendererLayerId?: string
  linkedBeatId?: string
  linkedSoundSyncCueId?: string
  reason: string
  qaChecks: string[]
  notes: string[]
}

export interface TimingBasePlan {
  fps: number
  totalDurationSeconds: number
  totalFrames: number
  sourceDurationSeconds: number
  finalDurationSeconds: number
  frameRoundingMode: 'floor' | 'ceil' | 'round'
  derivedFromAspectRatioFramePlan: boolean
  aspectRatioConfirmed: boolean
  notes: string[]
}

export interface SourceTimingItem {
  id: string
  clipId: string
  uploadedOrder: number
  sourceRange: FrameTimeRange
  selectedRange: FrameTimeRange
  trimDecisionItemId?: string
  role: ClipAnalysisRole | ClipSourceRole | 'unknown'
  reason: string
  trimNotes: string[]
  qaChecks: string[]
}

export interface FinalTimelineSegmentTiming {
  id: string
  segmentId?: string
  label: string
  role?: EditSegmentRole
  finalRange: FrameTimeRange
  sourceTimingItemIds: string[]
  timingCues: TimingCue[]
  pacingNotes: string[]
  qaChecks: string[]
}

export interface TranscriptTimingLine {
  id: string
  text: string
  timeRange: FrameTimeRange
  lineType: 'hook' | 'explanation' | 'emotion' | 'proof' | 'claim' | 'cta' | 'filler' | 'unknown'
  emphasisWords: string[]
  captionCueIds: string[]
  visualCueIds: string[]
  qaChecks: string[]
}

export interface TranscriptTimingPlan {
  id: string
  status: TimingPlanStatus
  lines: TranscriptTimingLine[]
  phraseBoundaryCueIds: string[]
  emotionalPauseCueIds: string[]
  limitations: string[]
  qaChecks: string[]
}

export interface BeatGridItem {
  id: string
  beatIndex: number
  timeSeconds: number
  frame: number
  isDownbeat: boolean
  confidence: 'low' | 'medium' | 'high'
  energy: 'low' | 'medium' | 'high'
  notes: string[]
}

export interface BeatGridPlan {
  id: string
  status: TimingPlanStatus
  bpm?: number
  beatItems: BeatGridItem[]
  dropCueIds: string[]
  onsetCueIds: string[]
  confidence: 'low' | 'medium' | 'high'
  limitations: string[]
  qaChecks: string[]
}

export interface CaptionTimingItem {
  id: string
  captionText: string
  timeRange: FrameTimeRange
  linkedTranscriptLineId?: string
  refinedCaptionTimingItemId?: string
  animationInFrames: number
  holdFrames: number
  animationOutFrames: number
  emphasisWord?: string
  readabilityScore: 'low' | 'medium' | 'high'
  qaChecks: string[]
}

export interface VisualTimingItem {
  id: string
  label: string
  visualType: VisualSupportOpportunityType | VisualAssetType | 'unknown'
  timeRange: FrameTimeRange
  linkedSegmentId?: string
  linkedVisualAssetPlanItemId?: string
  linkedLayoutItemId?: string
  visualCueTimingItemId?: string
  revealFrames: number
  holdFrames: number
  exitFrames: number
  readTimeFrames: number
  reason: string
  qaChecks: string[]
}

export interface TransitionTimingItem {
  id: string
  transitionType: TransitionFamilyId | 'hard_cut' | 'custom'
  timeRange: FrameTimeRange
  fromSegmentId?: string
  toSegmentId?: string
  refinedTransitionTimingItemId?: string
  beatAligned: boolean
  phraseBoundaryAligned: boolean
  sfxCueId?: string
  reason: string
  qaChecks: string[]
}

export interface SfxTimingItem {
  id: string
  cueType: SoundSyncCueType | 'custom'
  label: string
  timeRange: FrameTimeRange
  linkedVisualTimingItemId?: string
  linkedTransitionTimingItemId?: string
  refinedSfxTimingItemId?: string
  intensity: SfxIntensity
  reason: string
  avoidRules: string[]
  qaChecks: string[]
}

export interface MusicDuckingTimingItem {
  id: string
  timeRange: FrameTimeRange
  duckingStrength: 'none' | 'light' | 'medium' | 'strong'
  linkedSpeechLineId?: string
  refinedMusicDuckingTimingItemId?: string
  attackFrames: number
  releaseFrames: number
  reason: string
  qaChecks: string[]
}

export interface RemotionLayerTimingItem {
  id: string
  rendererLayerId?: string
  label: string
  layerType: string
  timeRange: FrameTimeRange
  zIndex?: number
  linkedVisualTimingItemId?: string
  linkedCaptionTimingItemId?: string
  linkedSfxTimingItemId?: string
  reason: string
  qaChecks: string[]
}

export interface ProviderClipTimingItem {
  id: string
  providerModel?: ProviderModel
  visualAssetPlanItemId?: string
  expectedDurationSeconds: number
  expectedDurationFrames: number
  placementRange: FrameTimeRange
  startFramePurpose?: string
  endFramePurpose?: string
  reason: string
  qaChecks: string[]
}

export interface TimingQaCheck {
  id: string
  label: string
  riskLevel: TimingRiskLevel
  passedMock: boolean
  message: string
  recommendation?: string
  linkedCueIds: string[]
}

export interface MasterTimingPlan {
  id: string
  status: TimingPlanStatus
  summary: string
  sourceCleanupPlanId?: string
  captionVisualCueTimingPlanId?: string
  soundSyncTransitionTimingPlanId?: string
  timingValidationPlanId?: string
  timingBase: TimingBasePlan
  sourceTimingItems: SourceTimingItem[]
  finalTimelineSegments: FinalTimelineSegmentTiming[]
  transcriptTimingPlan: TranscriptTimingPlan
  beatGridPlan: BeatGridPlan
  captionTimingItems: CaptionTimingItem[]
  visualTimingItems: VisualTimingItem[]
  transitionTimingItems: TransitionTimingItem[]
  sfxTimingItems: SfxTimingItem[]
  musicDuckingTimingItems: MusicDuckingTimingItem[]
  remotionLayerTimingItems: RemotionLayerTimingItem[]
  providerClipTimingItems: ProviderClipTimingItem[]
  globalRules: string[]
  qaChecks: TimingQaCheck[]
  limitations: string[]
  notes: string[]
}

export interface CaptionWordTiming {
  id: string
  word: string
  timeRange: FrameTimeRange
  emphasized: boolean
  confidence: 'low' | 'medium' | 'high'
  notes: string[]
}

export interface CaptionPhraseTiming {
  id: string
  text: string
  timeRange: FrameTimeRange
  words: CaptionWordTiming[]
  linkedTranscriptLineId?: string
  phraseRole: 'hook' | 'explanation' | 'emotion' | 'proof' | 'claim' | 'cta' | 'filler' | 'unknown'
  qaChecks: string[]
}

export interface CaptionStyleTimingPolicy {
  id: string
  chunkingMode: CaptionChunkingMode
  animationStyle: CaptionAnimationTimingStyle
  maxWordsPerCaption: number
  minDurationFrames: number
  maxDurationFrames: number
  leadInFrames: number
  lagFrames: number
  animationInFrames: number
  animationOutFrames: number
  safeGapFrames: number
  emphasisAllowed: boolean
  maxEmphasisWordsPerCaption: number
  avoidRules: string[]
  qaChecks: string[]
}

export interface RefinedCaptionTimingItem {
  id: string
  captionText: string
  phraseTimingId?: string
  linkedMasterCaptionTimingItemId?: string
  linkedTranscriptLineId?: string
  timeRange: FrameTimeRange
  chunkingMode: CaptionChunkingMode
  animationStyle: CaptionAnimationTimingStyle
  emphasisWords: string[]
  readabilityRisk: CaptionReadabilityRisk
  readabilityScore: 'low' | 'medium' | 'high'
  safeZoneNotes: string[]
  collisionAvoidanceNotes: string[]
  reason: string
  qaChecks: string[]
}

export interface VisualCueTimingItem {
  id: string
  cueType: VisualCueType
  triggerType: VisualCueTriggerType
  status: VisualCueSyncStatus
  label: string
  timeRange: FrameTimeRange
  linkedMasterVisualTimingItemId?: string
  linkedSegmentId?: string
  linkedVisualAssetPlanItemId?: string
  linkedCaptionTimingItemId?: string
  linkedTranscriptLineId?: string
  linkedBeatId?: string
  linkedSoundSyncCueId?: string
  visualReadTimeFrames: number
  revealFrames: number
  holdFrames: number
  exitFrames: number
  safeZoneNotes: string[]
  reason: string
  fallbackTiming?: FrameTimeRange
  qaChecks: string[]
}

export interface CaptionVisualCollisionPlan {
  id: string
  label: string
  affectedCaptionTimingItemIds: string[]
  affectedVisualCueTimingItemIds: string[]
  risk: CaptionReadabilityRisk
  issue: string
  recommendation: string
  fallbackLayoutMode?: SpeakerVisualLayoutMode
  qaChecks: string[]
}

export interface CaptionVisualCueTimingPlan {
  id: string
  status: VisualCueSyncStatus
  summary: string
  timingValidationPlanId?: string
  captionPolicy: CaptionStyleTimingPolicy
  captionPhraseTimings: CaptionPhraseTiming[]
  refinedCaptionTimings: RefinedCaptionTimingItem[]
  visualCueTimings: VisualCueTimingItem[]
  collisionPlans: CaptionVisualCollisionPlan[]
  globalRules: string[]
  qaChecks: TimingQaCheck[]
  limitations: string[]
  notes: string[]
}

export interface MusicPhraseTimingItem {
  id: string
  phraseType: MusicPhraseType
  label: string
  timeRange: FrameTimeRange
  energy: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  notes: string[]
}

export interface SoundSyncBeatGridItem {
  id: string
  beatIndex: number
  timeSeconds: number
  frame: number
  isDownbeat: boolean
  isDropMoment: boolean
  isOnset: boolean
  energy: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  linkedMusicPhraseId?: string
  notes: string[]
}

export interface SoundSyncBeatGridPlan {
  id: string
  status: SoundSyncAnalysisStatus
  bpm?: number
  confidence: 'low' | 'medium' | 'high'
  beatItems: SoundSyncBeatGridItem[]
  musicPhrases: MusicPhraseTimingItem[]
  snapToleranceFrames: number
  analysisToolPlanned: OpenSourceToolId[]
  globalRules: string[]
  limitations: string[]
  qaChecks: string[]
}

export interface BeatSnapDecisionPlan {
  id: string
  targetCueId?: string
  requestedFrame: number
  snappedFrame: number
  snapDecision: BeatSnapDecision
  linkedBeatId?: string
  linkedPhraseBoundaryCueId?: string
  speechSafe: boolean
  reason: string
  qaChecks: string[]
}

export interface RefinedTransitionTimingItem {
  id: string
  transitionType: TransitionTimingType
  timeRange: FrameTimeRange
  fromSegmentId?: string
  toSegmentId?: string
  fromLayoutMode?: SpeakerVisualLayoutMode
  toLayoutMode?: SpeakerVisualLayoutMode
  linkedMasterTransitionTimingItemId?: string
  beatSnapDecision?: BeatSnapDecisionPlan
  phraseBoundaryAligned: boolean
  beatAligned: boolean
  downbeatAligned: boolean
  visualMotivated: boolean
  audioMotivated: boolean
  durationFrames: number
  riskLevel: TransitionRiskLevel
  sfxCueId?: string
  reason: string
  fallbackTransitionType?: TransitionTimingType
  qaChecks: string[]
}

export interface RefinedSfxTimingItem {
  id: string
  cueType: SoundSyncCueType | 'custom'
  label: string
  timeRange: FrameTimeRange
  linkedVisualCueTimingItemId?: string
  linkedTransitionTimingItemId?: string
  linkedBeatId?: string
  intensity: SfxIntensity
  densityLevel: SfxDensityLevel
  reason: string
  avoidRules: string[]
  qaChecks: string[]
}

export interface RefinedMusicDuckingTimingItem {
  id: string
  timeRange: FrameTimeRange
  duckingStrength: 'none' | 'light' | 'medium' | 'strong'
  reasonType: DuckingReasonType
  linkedSpeechLineId?: string
  linkedCaptionTimingItemId?: string
  attackFrames: number
  releaseFrames: number
  preserveMusicDrop: boolean
  voicePriority: boolean
  reason: string
  qaChecks: string[]
}

export interface SoundSyncTransitionTimingQaCheck {
  id: string
  label: string
  riskLevel: TimingRiskLevel
  passedMock: boolean
  message: string
  recommendation?: string
  linkedTransitionTimingItemIds: string[]
  linkedSfxTimingItemIds: string[]
  linkedDuckingTimingItemIds: string[]
}

export interface SoundSyncTransitionTimingPlan {
  id: string
  status: SoundSyncAnalysisStatus
  summary: string
  timingValidationPlanId?: string
  beatGridPlan: SoundSyncBeatGridPlan
  beatSnapDecisions: BeatSnapDecisionPlan[]
  refinedTransitionTimings: RefinedTransitionTimingItem[]
  refinedSfxTimings: RefinedSfxTimingItem[]
  refinedMusicDuckingTimings: RefinedMusicDuckingTimingItem[]
  sfxDensityLevel: SfxDensityLevel
  globalRules: string[]
  qaChecks: SoundSyncTransitionTimingQaCheck[]
  limitations: string[]
  notes: string[]
}

export type TimingValidationStatus =
  | 'passed'
  | 'warning'
  | 'failed'
  | 'blocking'

export type TimingValidationCategory =
  | 'frame_confirmation'
  | 'timing_base'
  | 'source_timing'
  | 'final_timeline'
  | 'transcript_timing'
  | 'caption_readability'
  | 'visual_readability'
  | 'caption_visual_collision'
  | 'transition_safety'
  | 'beat_alignment'
  | 'sfx_justification'
  | 'music_ducking'
  | 'provider_clip_duration'
  | 'remotion_layer_timing'
  | 'tier_complexity'
  | 'credit_impact'
  | 'approval_gate'
  | 'worker_readiness'

export type TimingComplexityLevel =
  | 'none'
  | 'simple'
  | 'moderate'
  | 'advanced'
  | 'premium'

export type TimingCreditImpactLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'premium'

export interface TimingValidationCheck {
  id: string
  category: TimingValidationCategory
  label: string
  status: TimingValidationStatus
  severity: 'info' | 'warning' | 'error' | 'blocking'
  message: string
  recommendation?: string
  relatedCueIds: string[]
  relatedSegmentId?: string
  relatedVisualAssetPlanItemId?: string
  relatedCaptionTimingItemId?: string
  relatedTransitionTimingItemId?: string
  relatedSfxTimingItemId?: string
  relatedProviderClipTimingItemId?: string
}

export interface TimingCreditProfile {
  id: string
  complexity: TimingComplexityLevel
  label: string
  description: string
  creditImpact: TimingCreditImpactLevel
  estimatedPlanningCredits: number
  bestFor: string[]
  avoidFor: string[]
  tierFit: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  requiresQa: boolean
  qaChecks: string[]
}

export interface TimingLowerCostRecommendation {
  id: string
  label: string
  estimatedCreditSavings: number
  tradeoff: string
  whatChanges: string[]
  keepsProfessionalQuality: boolean
  requiresNewApproval: boolean
  actionType:
    | 'simpler_caption_animation'
    | 'reduce_emphasis_words'
    | 'reduce_visual_cue_density'
    | 'use_phrase_cuts_only'
    | 'remove_beat_sync'
    | 'reduce_sfx_density'
    | 'simpler_transitions'
    | 'shorter_ai_clip_duration'
    | 'convert_animation_to_still'
    | 'use_static_card'
    | 'voice_only_timing'
    | 'custom'
}

export interface TimingValidationPlanItem {
  id: string
  label: string
  relatedSegmentId?: string
  complexity: TimingComplexityLevel
  creditProfileId: string
  status: TimingValidationStatus
  checks: TimingValidationCheck[]
  creditImpact: TimingCreditImpactLevel
  estimatedPlanningCredits: number
  lowerCostRecommendations: TimingLowerCostRecommendation[]
  userFacingSummary: string
  developerNotes: string[]
}

export interface TimingValidationPlan {
  id: string
  active: boolean
  summary: string
  overallStatus: TimingValidationStatus
  items: TimingValidationPlanItem[]
  creditProfilesUsed: string[]
  totalEstimatedTimingCredits: number
  lowerCostRecommendations: TimingLowerCostRecommendation[]
  globalChecks: TimingValidationCheck[]
  approvalBlocked: boolean
  approvalBlockReasons: string[]
  qaChecks: string[]
  limitations: string[]
  notes: string[]
}

export type CleanupPreference =
  | 'preserve_natural'
  | 'light_cleanup'
  | 'balanced_cleanup'
  | 'tight_retention_cleanup'
  | 'aggressive_cleanup'
  | 'documentary_faithful'
  | 'tutorial_complete'
  | 'custom'

export type CleanupConfirmationStatus =
  | 'not_started'
  | 'recommended'
  | 'needs_confirmation'
  | 'confirmed'
  | 'changed_after_plan'

export type TrimDecisionType =
  | 'keep'
  | 'cut'
  | 'tighten'
  | 'preserve'
  | 'move_to_broll'
  | 'use_as_voiceover'
  | 'use_as_proof'
  | 'use_as_alt_take'
  | 'needs_user_review'
  | 'cannot_decide_mock'

export type KeepReason =
  | 'strong_hook'
  | 'clear_explanation'
  | 'emotional_moment'
  | 'product_demo_required'
  | 'tutorial_step_required'
  | 'proof_or_evidence'
  | 'source_context_required'
  | 'user_marked_important'
  | 'good_visual_moment'
  | 'good_audio_moment'
  | 'key_story_beat'
  | 'cta'
  | 'behind_the_scenes_authenticity'
  | 'transition_context'
  | 'custom'

export type CutReason =
  | 'dead_space'
  | 'long_silence'
  | 'filler_words'
  | 'false_start'
  | 'repeated_take'
  | 'duplicate_point'
  | 'mistake'
  | 'off_topic'
  | 'weak_explanation'
  | 'bad_audio'
  | 'bad_visual'
  | 'shaky_or_blurry'
  | 'setup_cleanup'
  | 'privacy_sensitive'
  | 'user_marked_optional'
  | 'pacing_drag'
  | 'unclear_context'
  | 'custom'

export type TrimRiskLevel = 'low' | 'medium' | 'high' | 'blocking'

export interface CleanupPreferenceRecommendation {
  recommendedPreference: CleanupPreference
  reason: string
  confidence: 'low' | 'medium' | 'high'
  mustConfirm: boolean
}

export interface SourceRangePlan {
  clipId: string
  startSeconds: number
  endSeconds: number
  startFrame?: number
  endFrame?: number
  durationSeconds: number
  notes: string[]
}

export interface TrimDecisionItem {
  id: string
  clipId: string
  sourceRange: SourceRangePlan
  decision: TrimDecisionType
  keepReasons: KeepReason[]
  cutReasons: CutReason[]
  riskLevel: TrimRiskLevel
  finalUse: 'main_timeline' | 'broll' | 'voiceover_support' | 'proof' | 'alt_take' | 'removed' | 'user_review'
  userReviewRequired: boolean
  reason: string
  affectedMeaningRisk: boolean
  linkedSegmentId?: string
  linkedTimingCueIds: string[]
  meaningPreservationCheckIds?: string[]
  qaChecks: string[]
  notes: string[]
}

export interface RetakeGroupPlan {
  id: string
  clipIds: string[]
  label: string
  selectedClipId?: string
  selectedDecisionItemId?: string
  alternateDecisionItemIds: string[]
  retakeSelectionPlanItemId?: string
  reason: string
  userReviewRequired: boolean
  qaChecks: string[]
}

export interface CleanupQuestionPlan {
  id: string
  question: string
  options: CleanupPreference[]
  recommendedOption: CleanupPreference
  reason: string
  requiredBeforeApproval: boolean
  answered: boolean
}

export interface SourceCleanupPlan {
  id: string
  status: CleanupConfirmationStatus
  selectedPreference?: CleanupPreference
  recommendedPreference: CleanupPreferenceRecommendation
  cleanupQuestion: CleanupQuestionPlan
  retakeSelectionPlanId?: string
  meaningPreservationValidationPlanId?: string
  trimReviewPlanId?: string
  decisions: TrimDecisionItem[]
  retakeGroups: RetakeGroupPlan[]
  preservedRanges: TrimDecisionItem[]
  cutRanges: TrimDecisionItem[]
  userReviewItems: TrimDecisionItem[]
  finalDurationImpactSeconds: number
  meaningPreservationRules: string[]
  globalRules: string[]
  qaChecks: string[]
  limitations: string[]
  notes: string[]
}

export type RetakeSelectionStrategy =
  | 'latest_good_take'
  | 'clearest_explanation'
  | 'strongest_emotion'
  | 'best_audio_visual_quality'
  | 'user_marked_important'
  | 'preserve_multiple_for_broll'
  | 'preserve_multiple_for_context'
  | 'ask_user_review'
  | 'custom'

export type RetakeCandidateQuality =
  | 'unknown'
  | 'weak'
  | 'acceptable'
  | 'good'
  | 'best_mock'

export type RetakeSelectionConfidence =
  | 'low'
  | 'medium'
  | 'high'

export type MeaningPreservationCategory =
  | 'claim_context'
  | 'evidence_context'
  | 'tutorial_completeness'
  | 'product_demo_continuity'
  | 'story_meaning'
  | 'emotional_pause'
  | 'user_marked_important'
  | 'source_order'
  | 'privacy_sensitive'
  | 'documentary_safety'
  | 'retake_ambiguity'
  | 'custom'

export type MeaningPreservationStatus =
  | 'passed'
  | 'warning'
  | 'failed'
  | 'blocking'

export interface RetakeCandidatePlan {
  id: string
  clipId: string
  sourceRange: SourceRangePlan
  candidateLabel: string
  inferredTakeNumber?: number
  quality: RetakeCandidateQuality
  strengths: string[]
  weaknesses: string[]
  userMarkedImportant: boolean
  userMarkedOptional: boolean
  suggestedUse: TrimDecisionType
  reason: string
  qaChecks: string[]
}

export interface RetakeSelectionPlanItem {
  id: string
  label: string
  strategy: RetakeSelectionStrategy
  candidates: RetakeCandidatePlan[]
  selectedCandidateId?: string
  alternateCandidateIds: string[]
  confidence: RetakeSelectionConfidence
  userReviewRequired: boolean
  selectedUse: 'main_timeline' | 'broll' | 'proof' | 'alt_take' | 'removed' | 'user_review'
  reason: string
  fallbackDecision: string
  qaChecks: string[]
}

export interface MeaningPreservationCheck {
  id: string
  category: MeaningPreservationCategory
  label: string
  status: MeaningPreservationStatus
  severity: 'info' | 'warning' | 'error' | 'blocking'
  relatedTrimDecisionItemIds: string[]
  relatedRetakeSelectionItemIds: string[]
  relatedClipIds: string[]
  message: string
  recommendation: string
  userReviewRequired: boolean
}

export interface MeaningPreservationValidationPlan {
  id: string
  status: MeaningPreservationStatus
  summary: string
  checks: MeaningPreservationCheck[]
  blockingReasons: string[]
  userReviewRequired: boolean
  userReviewItems: MeaningPreservationCheck[]
  globalRules: string[]
  qaChecks: string[]
  limitations: string[]
  notes: string[]
}

export interface RetakeSelectionPlan {
  id: string
  active: boolean
  summary: string
  items: RetakeSelectionPlanItem[]
  selectedCandidateCount: number
  userReviewRequiredCount: number
  globalRules: string[]
  limitations: string[]
  notes: string[]
}

export interface TrimReviewPlan {
  id: string
  summary: string
  retakeSelectionPlan: RetakeSelectionPlan
  meaningPreservationValidationPlan: MeaningPreservationValidationPlan
  approvalBlocked: boolean
  approvalBlockReasons: string[]
  userFacingReviewSummary: string[]
  nextUserQuestions: string[]
  qaChecks: string[]
  limitations: string[]
}

export interface CaptionPlan {
  style: CaptionStyleId
  placement: string
  maxLines: number
  keywordEmphasis: boolean
  faceSafe: boolean
  animationStyle: string
  notes: string[]
}

export interface BrollPlan {
  policy: BrollPolicyId
  sourcePriority: string[]
  timingRule: string
  meaningRule: string
  avoidRules: string[]
  notes: string[]
}

export interface ColorGradePlan {
  style: ColorGradeStyleId
  intensity: 'light' | 'medium' | 'strong'
  operations: string[]
  skinToneProtection: boolean
  shotMatching: boolean
  avoidRules: string[]
  notes: string[]
}

export interface SoundPlan {
  style: SoundStyleId
  voiceCleanup: boolean
  musicBed: boolean
  ducking: boolean
  sfx: string[]
  avoidRules: string[]
  notes: string[]
}

export interface TransitionPlan {
  families: TransitionFamilyId[]
  preferredTransitions: string[]
  intensity: 'minimal' | 'balanced' | 'strong'
  timingRule: string
  avoidRules: string[]
  notes: string[]
}

export interface EditOperationPlan {
  id: string
  segmentId: string
  operationType: EditingOperationType
  operationOrder: number
  label: string
  instruction: string
  parameters: Record<string, unknown>
  reason: string
  status: EditOperationStatus
  qaChecks: string[]
}

export interface SegmentQAPlanItem {
  id: string
  category: QACategory
  label: string
  check: string
  status: QAStatus
  severity: 'low' | 'medium' | 'high' | 'blocking'
  fallbackActions: FallbackStep[]
  notes: string[]
}

export interface SegmentEditPlan {
  id: string
  segmentOrder: number
  role: EditSegmentRole
  label: string
  storyPurpose: string
  sourceClipIds: string[]
  sourceTimeRange?: TimeRange
  finalTimeRange: TimeRange
  finalTiming?: FrameTimeRange
  timingCueIds?: string[]
  captionVisualCueIds?: string[]
  trimDecisionItemIds?: string[]
  meaningPreservationCheckIds?: string[]
  spokenTextSummary?: string
  pacingStyle: PacingStyleId
  cutIntensity: CutIntensity
  captionPlan: CaptionPlan
  brollPlan: BrollPlan
  colorGradePlan: ColorGradePlan
  soundPlan: SoundPlan
  transitionPlan: TransitionPlan
  visualAssetPlanItemIds: string[]
  rendererLayerIds: string[]
  speakerVisualLayoutItemId?: string
  layoutMode?: SpeakerVisualLayoutMode
  speakerPresence?: SpeakerPresenceMode
  visualDominance?: VisualDominanceMode
  depthAwareOverlayItemId?: string
  depthCompositingMode?: DepthCompositingMode
  maskStrategy?: MaskStrategy
  renderStrategyItemIds?: string[]
  toolStrategyItemIds?: string[]
  mapAnimationPlanItemIds?: string[]
  dataVizPlanItemIds?: string[]
  colorPipelineOperationIds?: string[]
  audioOperationIds?: string[]
  soundSyncCueIds?: string[]
  mustFollowRules: string[]
  avoidRules: string[]
  operations: EditOperationPlan[]
  qaPlan: SegmentQAPlanItem[]
  workerNotes: string[]
  promptPlans?: ProviderPromptPlan[]
}

export interface EditQAPlan {
  id: string
  status: QAStatus
  summary: string
  globalChecks: SegmentQAPlanItem[]
  segmentChecks: SegmentQAPlanItem[]
  tierPolicyChecks: SegmentQAPlanItem[]
  approvalChecks: SegmentQAPlanItem[]
  notes: string[]
}

export type FallbackAction =
  | 'retry_same_model'
  | 'try_fallback_model'
  | 'simplify_prompt'
  | 'split_scene'
  | 'convert_to_still'
  | 'convert_to_motion_design'
  | 'upgrade_to_premium'
  | 'manual_review'

export interface FallbackStep {
  action: FallbackAction
  model?: ProviderModel
  label: string
  reason: string
  premiumOnly?: boolean
}

export interface ProviderRoute {
  primaryModel: ProviderModel
  fallbackModels: ProviderModel[]
  fallbackSteps: FallbackStep[]
  resolution: 'frame' | '720P' | '768P' | '1080P'
  durationSeconds: number
  providerPurpose: string
  internalCostHint: string
  userCreditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  reason: string
  veoAllowed: boolean
  premiumOnlyFallback: boolean
}

export interface QualityGate {
  status: 'not_checked' | 'passed' | 'needs_retry' | 'failed'
  checks: string[]
  failureFallbacks: FallbackStep[]
}

export interface ClipSource {
  id: string
  uploadedOrder: number
  fileName: string
  duration: string
  detectedType: string
  notes?: string
  isImportant?: boolean
  isOptional?: boolean
  sourceRole?: ClipSourceRole
  previewLabel?: string
  thumbnailHint?: string
  sourceOrderLocked?: boolean
}

export interface SourceSequenceMapItem {
  clipId: string
  uploadedOrder: number
  detectedRole: string
  strengths: string[]
  concerns: string[]
  possibleUses: string[]
}

export interface SignatureRoute {
  timeRange: string
  system: SignatureSystem
  reason: string
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
}

export interface VisualAssetPlanItem {
  id: string
  beatLabel: string
  storyPurpose: string
  narrativePhase: string
  emotion: string
  actionIntensity: 'low' | 'medium' | 'high' | 'extreme'
  assetType: VisualAssetType
  signatureSystem: SignatureSystem
  styleModeId?: string
  frameTemplateType: FrameTemplateType
  needsCharacterConsistency: boolean
  needsStartFrame: boolean
  needsEndFrame: boolean
  recommendedDurationSeconds: number
  plannedDurationFrames?: number
  timingCueIds?: string[]
  visualCueTimingIds?: string[]
  visualTimingItemId?: string
  providerRoute: ProviderRoute
  reason: string
  qaChecks: string[]
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  speakerVisualLayoutItemId?: string
  layoutMode?: SpeakerVisualLayoutMode
  speakerPresence?: SpeakerPresenceMode
  visualDominance?: VisualDominanceMode
  depthAwareOverlayItemId?: string
  depthCompositingMode?: DepthCompositingMode
  maskStrategy?: MaskStrategy
  renderStrategyItemId?: string
  renderStrategyType?: RenderStrategyType
  toolStrategyItemIds?: string[]
  mapAnimationPlanItemId?: string
  dataVizPlanItemId?: string
  colorMatchPlanId?: string
  promptPlans?: ProviderPromptPlan[]
  characterPackIds?: string[]
  factSafetyItemIds?: string[]
}

export interface CreditEstimate {
  total: number
  breakdown: {
    label: string
    credits: number
    reason: string
  }[]
  timingCredits?: number
  timingTradeoffs?: TimingLowerCostRecommendation[]
  editLevel?: EditLevel
  editingCategory?: EditingCategory
  visualSystemSummary?: CreditEstimateAssetSummary[]
  assetTypeSummary?: CreditEstimateAssetSummary[]
  fallbackAllowanceCredits?: number
  fallbackPolicyNotes?: CreditEstimatePolicyNote[]
  lowerCostAlternatives?: LowerCostAlternative[]
  riskLevel?: CreditEstimateRiskLevel
  approvalCopy?: string
  approvalBlocked?: boolean
  draftReason?: string
  estimateVersion?: string
}

export type CreditEstimateRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'premium'

export interface CreditEstimateAssetSummary {
  label: string
  count: number
  credits: number
  reason: string
}

export interface CreditEstimatePolicyNote {
  label: string
  tone: 'info' | 'warning' | 'success' | 'danger'
  message: string
}

export interface LowerCostAlternative {
  label: string
  estimatedSavings: number
  tradeoff: string
  actionHint: string
}

export type ChatPlanningPhase =
  | 'start'
  | 'source_sequence'
  | 'edit_setup'
  | 'understanding'
  | 'plan'
  | 'safety_qa'
  | 'credits_approval'
  | 'execution_preview'

export type ChatCardPriority =
  | 'required_user_action'
  | 'user_summary'
  | 'advanced_plan_detail'
  | 'safety_detail'
  | 'developer_detail'

export type ChatCardStatus =
  | 'not_started'
  | 'needs_input'
  | 'ready'
  | 'confirmed'
  | 'approved'
  | 'warning'
  | 'blocking'
  | 'complete'

export type ChatPlanningDisplayMode = 'guided' | 'detailed' | 'developer'

export interface ChatPlanningCardDescriptor {
  id: string
  label: string
  phase: ChatPlanningPhase
  priority: ChatCardPriority
  status: ChatCardStatus
  defaultExpanded: boolean
  requiredBeforeApproval: boolean
  summary: string
  hiddenInCompactMode?: boolean
}

export interface ChatPlanningPhaseSummary {
  phase: ChatPlanningPhase
  label: string
  status: ChatCardStatus
  completedCount: number
  totalCount: number
  summary: string
}

export type PlanningSystemAuditStatus =
  | 'connected'
  | 'partial'
  | 'missing'
  | 'warning'
  | 'blocking'

export type PlanningSystemLayerId =
  | 'source_sequence'
  | 'source_cleanup'
  | 'trim_review'
  | 'editing_agent_execution'
  | 'async_asset_reconciliation'
  | 'agent_qa_fallback'
  | 'aspect_ratio_frame_gate'
  | 'master_timing'
  | 'caption_visual_cue_timing'
  | 'soundsync_transition_timing'
  | 'timing_validation'
  | 'compiled_intent'
  | 'professional_editing'
  | 'video_understanding'
  | 'adaptive_strategy'
  | 'segment_operations'
  | 'visual_asset_plan'
  | 'speaker_visual_layout'
  | 'depth_overlay'
  | 'foreground_masking'
  | 'depth_layout_validation'
  | 'color_pipeline'
  | 'audio_pipeline'
  | 'map_animation'
  | 'dataviz'
  | 'browser_capture'
  | 'tool_registry'
  | 'render_strategy'
  | 'tool_strategy'
  | 'renderer_composition'
  | 'character_consistency'
  | 'fact_safety'
  | 'provider_prompts'
  | 'credit_estimate'
  | 'approved_snapshot'
  | 'worker_runtime'
  | 'production_readiness'
  | 'launch_tool_stack'
  | 'supabase_schema_bridge'
  | 'migration_drafts'
  | 'migration_review_rls'
  | 'supabase_production_readiness'
  | 'testing_readiness'
  | 'planner_validation'
  | 'planner_regression'
  | 'tool_previews'

export interface PlanningSystemLayerAudit {
  id: PlanningSystemLayerId
  label: string
  status: PlanningSystemAuditStatus
  hasTypes: boolean
  hasPlannerModule: boolean
  hasUiCard: boolean
  includedInEditPlan: boolean
  includedInApprovedSnapshot: boolean
  includedInValidation: boolean
  includedInCreditEstimate: boolean
  notes: string[]
  missingConnections: string[]
}

export interface PlanningSystemAuditReport {
  id: string
  overallStatus: PlanningSystemAuditStatus
  summary: string
  layers: PlanningSystemLayerAudit[]
  hardRuleChecks: {
    label: string
    passed: boolean
    message: string
  }[]
  launchToolStackChecks: {
    label: string
    passed: boolean
    message: string
  }[]
  duplicateOrLegacyWarnings: string[]
  nextPhaseRecommendations: string[]
  limitations: string[]
}

export interface EditPlan {
  goalSummary: string
  sourceSequenceMap: SourceSequenceMapItem[]
  sourceSequenceReview?: SourceSequenceReviewState
  sourceCleanupPlan?: SourceCleanupPlan
  trimReviewPlan?: TrimReviewPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
  agentQAFallbackPlan?: AgentQAFallbackPlan
  recommendedStructure: string[]
  hookDecision: {
    policy: HookPolicy
    recommendation: string
    reason: string
  }
  referenceDNA?: {
    pacing: string
    music: string
    captions: string
    transitions: string
    visualStyle: string
    adaptationRule: string
  }
  signatureRoutes: SignatureRoute[]
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategy?: AdaptiveEditStrategy
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  toolRegistrySummary?: ToolRegistrySummary
  toolStrategyPlan?: ToolStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  aspectRatioFramePlan?: AspectRatioFramePlan
  masterTimingPlan?: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  soundSyncTransitionTimingPlan?: SoundSyncTransitionTimingPlan
  timingValidationPlan?: TimingValidationPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  renderStrategyPlan?: RenderStrategyPlan
  rendererCompositionPlan?: RendererCompositionPlan
  compiledIntent?: CompiledEditingIntent
  professionalEditingDirective?: ProfessionalEditingDirective
  segmentEditPlans?: SegmentEditPlan[]
  editQAPlan?: EditQAPlan
  providerPromptPlans?: ProviderPromptPlan[]
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
  planningSystemAuditReport?: PlanningSystemAuditReport
  supabaseSchemaPlan?: SupabaseSchemaPlan
  migrationDraftPlan?: MigrationDraftPlan
  migrationReviewPlan?: MigrationReviewPlan
  supabaseProductionReadinessPlan?: SupabaseProductionReadinessPlan
  testingReadinessReport?: TestingReadinessReport
  soundSyncDirection: string
  captionDirection: string
  creditEstimate: CreditEstimate
  approvalRequired: boolean
}

export interface PlannerInput {
  projectName: string
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  aspectRatioConfirmed?: boolean
  aspectRatioSource?: AspectRatioSource
  aspectRatioFramePlan?: AspectRatioFramePlan
  masterTimingPlan?: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  soundSyncTransitionTimingPlan?: SoundSyncTransitionTimingPlan
  timingValidationPlan?: TimingValidationPlan
  frameTemplateType?: FrameTemplateType
  editingCategory: EditingCategory
  workflowType: VideoWorkflowType
  editLevel: EditLevel
  structurePreference: StructurePreference
  moodStyle: MoodStyle
  visualPreference: VisualPreference
  referenceUrl: string
  customInstructions: string
  creditPreference: CreditPreference
  clips: ClipSource[]
  sourceSequenceMode?: SourceSequenceMode
  sourceOrderConfirmed?: boolean
  cleanupPreference?: CleanupPreference
  cleanupPreferenceConfirmed?: boolean
  sourceCleanupPlan?: SourceCleanupPlan
  trimReviewPlan?: TrimReviewPlan
  videoUnderstandingReport?: VideoUnderstandingReport
  compiledIntent?: CompiledEditingIntent
  professionalEditingDirective?: ProfessionalEditingDirective
}
