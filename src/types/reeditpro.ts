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

export type AspectRatio = '9:16' | '16:9' | '1:1' | 'let_ai_decide'

export type FrameTemplateType =
  | 'vertical_talking_head_lower_panel'
  | 'vertical_full_panel'
  | 'youtube_side_panel'
  | 'youtube_lower_panel'
  | 'square_center_panel'
  | 'let_ai_decide'

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
  | 'user_intent_match'
  | 'source_order_and_structure'
  | 'pacing_and_cuts'
  | 'captions'
  | 'color_grade'
  | 'b_roll'
  | 'sound_sync'
  | 'transitions'
  | 'visual_assets'
  | 'frame_layout'
  | 'model_tier_policy'
  | 'credit_approval'
  | 'safety_and_claims'
  | 'render_composition'

export interface TimeRange {
  startSeconds: number
  endSeconds: number
  label?: string
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
  providerRoute: ProviderRoute
  reason: string
  qaChecks: string[]
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
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
  editLevel?: EditLevel
  editingCategory?: EditingCategory
  visualSystemSummary?: CreditEstimateAssetSummary[]
  assetTypeSummary?: CreditEstimateAssetSummary[]
  fallbackAllowanceCredits?: number
  fallbackPolicyNotes?: CreditEstimatePolicyNote[]
  lowerCostAlternatives?: LowerCostAlternative[]
  riskLevel?: CreditEstimateRiskLevel
  approvalCopy?: string
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

export interface EditPlan {
  goalSummary: string
  sourceSequenceMap: SourceSequenceMapItem[]
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
  visualAssetPlan?: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
  compiledIntent?: CompiledEditingIntent
  professionalEditingDirective?: ProfessionalEditingDirective
  segmentEditPlans?: SegmentEditPlan[]
  editQAPlan?: EditQAPlan
  providerPromptPlans?: ProviderPromptPlan[]
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
  soundSyncDirection: string
  captionDirection: string
  creditEstimate: CreditEstimate
  approvalRequired: boolean
}

export interface PlannerInput {
  projectName: string
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
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
  compiledIntent?: CompiledEditingIntent
  professionalEditingDirective?: ProfessionalEditingDirective
}
