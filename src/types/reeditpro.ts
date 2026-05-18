export type SignatureSystem =
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'sound_sync'
  | 'none'

export type EditLevel = 'basic' | 'pro' | 'advanced_viral'

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

export type EditingCategory = VideoWorkflowType

export type TargetPlatform =
  | 'tiktok_reels_shorts'
  | 'youtube'
  | 'website'
  | 'course_training'
  | 'client_review'
  | 'custom'

export type AspectRatio = '9:16' | '16:9' | '1:1' | 'let_ai_decide'

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

export type ReferenceVideoMode =
  | 'no_reference'
  | 'user_pasted_link'
  | 'user_uploaded_reference'
  | 'mock_reference'
  | 'reference_skipped'

export type ReferenceAdaptationFocus =
  | 'overall_style'
  | 'opening_style'
  | 'pacing'
  | 'caption_style'
  | 'transition_style'
  | 'music_sound'
  | 'visual_effects'
  | 'b_roll'
  | 'color_mood'
  | 'signature_system_usage'
  | 'ignore_reference'

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

export interface CreditEstimate {
  total: number
  breakdown: {
    label: string
    credits: number
    reason: string
  }[]
}

export interface ReferenceDNA {
  id: string
  mode: ReferenceVideoMode
  referenceUrl?: string
  referenceLabel?: string
  topic: string
  openingStyle: string
  hookStyle: string
  pacing: string
  cutRhythm: string
  captionStyle: string
  captionDensity: string
  transitionStyle: string
  musicIntro: string
  soundSyncStyle: string
  visualEffectStyle: string
  brollStyle: string
  colorGradeMood: string
  signatureSystemUsage: string[]
  frameLayoutHints: string[]
  moodTone: string
  whatWorks: string[]
  adaptationRules: string[]
  doNotCopyRules: string[]
  userOverrides: string[]
  focus: ReferenceAdaptationFocus[]
  confidence: 'low' | 'medium' | 'high'
  sourceLimitations: string[]
}

export interface ReferenceVideoPlan {
  mode: ReferenceVideoMode
  referenceUrl?: string
  referenceProvided: boolean
  referenceDNA?: ReferenceDNA
  skipped: boolean
  userNotes: string[]
  requiredBeforeApproval: boolean
  status: 'not_started' | 'attached' | 'analyzed_mock' | 'skipped' | 'needs_review'
}

export type BrowserVisualType =
  | 'website_screenshot'
  | 'landing_page_capture'
  | 'product_page_capture'
  | 'ecommerce_page_capture'
  | 'saas_dashboard_capture'
  | 'app_screen_capture'
  | 'article_capture'
  | 'evidence_page_capture'
  | 'browser_mockup_frame'
  | 'before_after_website_comparison'
  | 'tutorial_screen_step'
  | 'scroll_sequence'
  | 'selector_focus'
  | 'ui_highlight_zoom'
  | 'webpage_timeline_card'
  | 'dashboard_metric_card'
  | 'custom_browser_visual'

export type BrowserCaptureMode =
  | 'static_screenshot'
  | 'element_screenshot'
  | 'full_page_screenshot'
  | 'viewport_capture'
  | 'scroll_sequence'
  | 'step_sequence'
  | 'before_after_capture'
  | 'mock_browser_frame'
  | 'uploaded_screenshot_only'
  | 'future_authenticated_capture'

export type BrowserSourceType =
  | 'user_provided_url'
  | 'uploaded_screenshot'
  | 'uploaded_screen_recording'
  | 'internal_mock'
  | 'script_reference'
  | 'unknown'

export type BrowserCapturePermissionStatus =
  | 'authorized'
  | 'user_provided'
  | 'needs_confirmation'
  | 'not_allowed'
  | 'unknown'
  | 'mock_only'

export type BrowserPrivacyRisk = 'none' | 'low' | 'medium' | 'high' | 'unknown'

export type BrowserEvidenceStatus =
  | 'not_evidence'
  | 'source_provided'
  | 'reported_source'
  | 'claimed_source'
  | 'mock_example'
  | 'unknown'

export type BrowserStyleFamily =
  | 'clean_product_demo'
  | 'saas_dashboard_premium'
  | 'documentary_evidence_page'
  | 'education_screen_tutorial'
  | 'ecommerce_product_focus'
  | 'social_browser_card'
  | 'comparison_before_after'
  | 'neutral_article_capture'
  | 'dark_mode_dashboard'
  | 'custom'

export interface RectZone {
  x: number
  y: number
  width: number
  height: number
}

export type SpeakerVisualLayoutMode =
  | 'full_visual_takeover'
  | 'screen_capture_with_speaker_pip'
  | 'side_by_side_speaker_visual'
  | 'lower_visual_panel'
  | 'picture_in_picture_speaker'
  | 'split_screen_comparison'
  | 'before_after_panel'
  | 'voiceover_visual_takeover'
  | 'browser_card_inside_evidence_board'
  | 'product_feature_callout'

export type FrameTemplateType =
  | 'vertical_story_frame'
  | 'horizontal_wide_frame'
  | 'square_social_frame'
  | 'browser_card'
  | 'evidence_board'
  | 'product_callout'
  | 'custom_frame'

export type ToolChainId = 'browser_capture_chain' | 'uploaded_screenshot_chain' | 'mock_browser_frame_chain'

export type OpenSourceToolId = 'playwright' | 'sharp' | 'remotion' | 'opencv' | 'gpt_image_2' | 'wan' | 'hailuo' | 'veo'

export type RemotionCapabilityId =
  | 'screen_capture_placement'
  | 'picture_in_picture'
  | 'safe_zone_layout'
  | 'transition_layer'
  | 'browser_frame_overlay'
  | 'zoom_pan_highlight'
  | 'split_screen_comparison'
  | 'caption_safe_composition'

export interface BrowserSourcePlan {
  id: string
  sourceType: BrowserSourceType
  url?: string
  label: string
  permissionStatus: BrowserCapturePermissionStatus
  evidenceStatus: BrowserEvidenceStatus
  sourceNeeded: boolean
  sourceLabel?: string
  safeWording: string
  mockOnly: boolean
  notes: string[]
}

export interface BrowserCaptureSettingsPlan {
  captureMode: BrowserCaptureMode
  viewportWidth: number
  viewportHeight: number
  deviceScaleFactor: number
  fullPage: boolean
  selector?: string
  clipRectangle?: RectZone
  imageFormat: 'png' | 'jpeg' | 'webp'
  imageQuality?: number
  waitTimeMs: number
  waitForSelector?: string
  scrollPosition?: number
  captureSequence?: string[]
  notes: string[]
}

export interface BrowserFrameStylePlan {
  styleFamily: BrowserStyleFamily
  showAddressBar: boolean
  showTabs: boolean
  showCursor: boolean
  theme: 'light' | 'dark' | 'auto'
  cornerRadius: number
  shadowStyle: string
  borderStyle: string
  toolbarColor?: string
  pageBackgroundColor?: string
  notes: string[]
}

export interface BrowserHighlightPlan {
  highlightSelector?: string
  highlightZone?: RectZone
  highlightColor: string
  highlightStyle: 'outline' | 'glow' | 'spotlight' | 'zoom' | 'arrow' | 'callout' | 'none'
  zoomTarget?: RectZone
  zoomScale?: number
  panDirection?: 'none' | 'up' | 'down' | 'left' | 'right'
  scrollAnimationDurationMs?: number
  stepRevealTimingMs?: number
  cursorMotion: boolean
  clickPulse: boolean
  annotationStyle: string
  calloutLabel?: string
  notes: string[]
}

export interface BrowserRedactionPlan {
  redactionNeeded: boolean
  privacyRisk: BrowserPrivacyRisk
  redactionTargets: string[]
  redactionStyle: 'blur' | 'block' | 'crop' | 'none'
  blurStrength?: number
  blockColor?: string
  userConfirmationRequired: boolean
  qaChecks: string[]
  notes: string[]
}

export interface BrowserLayoutPlan {
  layoutMode: SpeakerVisualLayoutMode
  frameTemplateType: FrameTemplateType
  browserZone?: RectZone
  speakerZone?: RectZone
  captionSafeZone?: RectZone
  safeMargins: number
  panelBackgroundColor: string
  labelAvoidZones: RectZone[]
  fullTakeoverMode: boolean
  pictureInPictureSpeaker: boolean
  notes: string[]
}

export interface BrowserCapturePlanItem {
  id: string
  segmentId?: string
  assetPlanItemId?: string
  visualAssetPlanItemId?: string
  speakerVisualLayoutItemId?: string
  renderStrategyItemId?: string
  toolStrategyItemId?: string
  browserVisualType: BrowserVisualType
  title: string
  purpose: string
  source: BrowserSourcePlan
  capture: BrowserCaptureSettingsPlan
  frameStyle: BrowserFrameStylePlan
  highlight: BrowserHighlightPlan
  redaction: BrowserRedactionPlan
  layout: BrowserLayoutPlan
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

export interface BrowserCapturePlan {
  id: string
  active: boolean
  summary: string
  items: BrowserCapturePlanItem[]
  browserToolsPlanned: OpenSourceToolId[]
  globalRules: string[]
  qaChecks: string[]
  limitations: string[]
  notes: string[]
}

export interface VisualAssetPlanItem {
  id: string
  title: string
  visualType: string
  notes: string[]
  browserCapturePlanItemId?: string
}

export interface SegmentEditPlan {
  id: string
  title: string
  browserCapturePlanItemIds?: string[]
}

export interface ProviderPromptPlan {
  id: string
  provider: string
  prompt: string
  browserCapturePlanNotes?: string[]
}

export interface VideoUnderstandingReport {
  opportunities?: string[]
  notes?: string[]
}

export interface AdaptiveEditStrategyPlan {
  toolHints?: string[]
  visualOpportunities?: string[]
}

export interface SpeakerVisualLayoutPlan {
  preferredLayoutMode?: SpeakerVisualLayoutMode
  notes?: string[]
}

export interface RenderStrategyPlan {
  strategyIds?: string[]
  notes?: string[]
}

export interface ToolStrategyPlan {
  toolChainIds?: ToolChainId[]
  notes?: string[]
}

export interface DataVizPlan {
  active?: boolean
  notes?: string[]
}

export interface AudioPipelinePlan {
  active?: boolean
  notes?: string[]
}

export interface CompiledEditingIntent {
  goalSummary: string
  explicitInstructions: string[]
  referencePreferences: string[]
  avoidRules: string[]
  userOverrides: string[]
  clarifyingNotes: string[]
  confidence: 'low' | 'medium' | 'high'
}

export interface ProfessionalEditingDirective {
  editLevel: EditLevel
  pacingStyle: string
  transitionFamilies: string[]
  captionStyle: string
  soundStyle: string
  visualDensity: string
  signatureSystemGuidance: string[]
  customDirectives: string[]
  avoidRules: string[]
  tierModelRules: string[]
  approvalRequired: true
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
  soundSyncDirection: string
  captionDirection: string
  referenceVideoPlan?: ReferenceVideoPlan
  browserCapturePlan?: BrowserCapturePlan
  compiledIntent?: CompiledEditingIntent
  professionalEditingDirective?: ProfessionalEditingDirective
  qaChecks?: string[]
  plannerValidation?: {
    passed: boolean
    checks: string[]
    warnings: string[]
  }
  providerPromptGuidance?: string[]
  creditEstimate: CreditEstimate
  approvalRequired: boolean
}

export interface PlannerInput {
  projectName: string
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  workflowType: VideoWorkflowType
  editLevel: EditLevel
  structurePreference: StructurePreference
  moodStyle: MoodStyle
  visualPreference: VisualPreference
  referenceUrl: string
  referenceVideoMode?: ReferenceVideoMode
  referenceAdaptationFocus?: ReferenceAdaptationFocus[]
  referenceNotes?: string[]
  customInstructions: string
  creditPreference: CreditPreference
  clips: ClipSource[]
}
